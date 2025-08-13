import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadPhoto } from '@/lib/storage';
import { withCSRFProtection } from '@/lib/csrf';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { RequestLimits, requestLimits } from '@/lib/request-limits';
import { validateInput } from '@/lib/validation';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// File upload validation schema
const uploadSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

// Allowed file types for security
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, rateLimiters.upload);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Apply request size limits
  return RequestLimits.withRequestLimits(async () => {
    // Apply CSRF protection
    return withCSRFProtection(request, async () => {
      try {
        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const workspaceId = formData.get('workspaceId') as string;

        if (!file || !workspaceId) {
          return NextResponse.json(
            { error: 'File and workspaceId are required' },
            { status: 400 }
          );
        }

        // Validate workspace ID format
        const validation = validateInput(uploadSchema, { workspaceId });
        if (!validation.success) {
          return NextResponse.json({ 
            error: 'Invalid input', 
            details: validation.errors 
          }, { status: 400 });
        }

        // Verify user has access to workspace
        const workspace = await prisma.workspace.findFirst({
          where: {
            id: workspaceId,
            users: { some: { id: session.user.id } }
          }
        });

        if (!workspace) {
          return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 403 });
        }

        // File security validation
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          return NextResponse.json({ 
            error: 'Invalid file type. Only images are allowed.' 
          }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ 
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
          }, { status: 400 });
        }

        // Check for malicious file names
        if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
          return NextResponse.json({ 
            error: 'Invalid file name' 
          }, { status: 400 });
        }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Google Cloud Storage
    const uploadResult = await uploadPhoto(buffer, file.name, file.type);

    // Save photo metadata to database
    const photo = await prisma.photo.create({
      data: {
        originalName: file.name,
        filename: uploadResult.filename,
        url: uploadResult.publicUrl,
        mimeType: file.type,
        size: uploadResult.size,
        uploadedById: session.user.id,
        workspaceId: workspaceId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        selections: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

        return NextResponse.json({ photo });
      } catch (error) {
        console.error('Error uploading photo:', error);
        return NextResponse.json(
          { error: 'Failed to upload photo' },
          { status: 500 }
        );
      }
    });
  }, requestLimits.upload);
}
