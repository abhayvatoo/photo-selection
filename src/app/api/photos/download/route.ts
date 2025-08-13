import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import archiver from 'archiver';
import { Readable } from 'stream';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { withCSRFProtection } from '@/lib/csrf';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Constants for download operations
const MAX_DOWNLOAD_SIZE = 100; // Limit downloads to prevent abuse
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max per file

// Input validation schema
const downloadSchema = z.object({
  photoIds: z.array(z.number().int().positive())
    .min(1, 'At least one photo ID is required')
    .max(MAX_DOWNLOAD_SIZE, `Cannot download more than ${MAX_DOWNLOAD_SIZE} photos at once`)
});

// Validate user access to photos with workspace control
async function validatePhotoAccess(photoIds: number[], userId: string, userRole: UserRole) {
  // Get user's workspace
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workspaceId: true }
  });

  let whereClause: any = {
    id: { in: photoIds }
  };

  if (userRole !== UserRole.SUPER_ADMIN) {
    // Non-admin users can only download photos from their workspace
    whereClause.workspaceId = user?.workspaceId;
    
    // Users can only download photos they have selected
    whereClause.selections = {
      some: {
        userId: userId
      }
    };
  }

  return await prisma.photo.findMany({
    where: whereClause,
    select: {
      id: true,
      filename: true,
      originalName: true,
      url: true,
      mimeType: true,
      size: true,
      workspaceId: true,
    },
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 1. Rate limiting for download operations
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.general);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. CSRF protection
    return withCSRFProtection(request, async () => {
      // 3. Authentication check
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const userId = session.user.id;
      const userRole = (session.user as any)?.role as UserRole;

      // 4. Input validation
      let requestBody;
      try {
        requestBody = await request.json();
      } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }

      const validationResult = downloadSchema.safeParse(requestBody);
      if (!validationResult.success) {
        return NextResponse.json({ 
          error: 'Invalid input', 
          details: validationResult.error.issues.map(issue => issue.message)
        }, { status: 400 });
      }

      const { photoIds } = validationResult.data;

      // 5. Validate photo access with workspace control
      const photos = await validatePhotoAccess(photoIds, userId, userRole);

      if (photos.length === 0) {
        return NextResponse.json({ 
          error: 'No accessible photos found or insufficient permissions' 
        }, { status: 404 });
      }

      // 6. Check total file size to prevent abuse
      const totalSize = photos.reduce((sum, photo) => sum + (photo.size || 0), 0);
      const maxTotalSize = MAX_FILE_SIZE * photos.length;
      
      if (totalSize > maxTotalSize) {
        return NextResponse.json({ 
          error: 'Download size exceeds limit' 
        }, { status: 413 });
      }

      // 7. Create ZIP archive with security measures
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Set up response headers for ZIP download
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `selected-photos-${timestamp}.zip`;
      
      const headers = new Headers({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });

      // Create a readable stream for the response
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      // Handle archive events
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        writer.close();
      });

      archive.on('end', () => {
        writer.close();
      });

      // Pipe archive data to the writable stream
      archive.on('data', (chunk) => {
        writer.write(chunk);
      });

      // Add photos to archive with security checks
      for (const photo of photos) {
        try {
          // Validate file size before processing
          if (photo.size && photo.size > MAX_FILE_SIZE) {
            console.warn(`Skipping photo ${photo.id}: file too large`);
            continue;
          }

          // Fetch the photo file with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const photoResponse = await fetch(photo.url, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (photoResponse.ok) {
            const photoBuffer = await photoResponse.arrayBuffer();
            const photoStream = Readable.from(Buffer.from(photoBuffer));
            
            // Sanitize filename to prevent path traversal
            const safeName = (photo.originalName || photo.filename)
              .replace(/[^a-zA-Z0-9._-]/g, '_')
              .substring(0, 255);
            
            // Add to archive with sanitized filename
            archive.append(photoStream, { 
              name: safeName 
            });
          }
        } catch (error) {
          // Log error but continue with other photos
          console.warn(`Skipping photo ${photo.id}: processing failed`);
        }
      }

      // Finalize the archive
      archive.finalize();

      return new NextResponse(readable, { headers });
    });
  });
}
