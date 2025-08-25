import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Allowed file extensions for security
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

// Validate filename security
function validateFilename(filename: string): boolean {
  // Check for directory traversal attempts
  if (
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\')
  ) {
    return false;
  }

  // Check for null bytes and other dangerous characters
  if (filename.includes('\0') || filename.includes('%00')) {
    return false;
  }

  // Check file extension
  const ext = filename.toLowerCase().split('.').pop();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return false;
  }

  // Check filename length
  if (filename.length > 255) {
    return false;
  }

  return true;
}

// Validate user access to photo file
async function validatePhotoAccess(
  filename: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  try {
    // Get user's workspace
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true },
    });

    if (!user?.workspaceId && userRole !== UserRole.SUPER_ADMIN) {
      return false;
    }

    // Find photo by filename
    const photo = await prisma.photo.findFirst({
      where: {
        filename: filename,
      },
      select: {
        id: true,
        workspaceId: true,
      },
    });

    if (!photo) {
      return false;
    }

    // SUPER_ADMIN can access any photo
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check if photo is in user's workspace
    if (photo.workspaceId !== user?.workspaceId) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating photo access:', error);
    return false;
  }
}

// Get content type based on file extension
function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: { filename: string } }
  ) => {
    // 1. Rate limiting for file serving
    const rateLimitResponse = await applyRateLimit(
      request,
      rateLimiters.general
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = (session.user as any)?.role as UserRole;

    // 3. Input validation
    const { filename } = params;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { error: 'Invalid filename parameter' },
        { status: 400 }
      );
    }

    // 4. Filename security validation
    if (!validateFilename(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename format' },
        { status: 400 }
      );
    }

    // 5. Validate user access to photo
    const hasAccess = await validatePhotoAccess(filename, userId, userRole);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 6. File system operations with security checks
    const bucketPath = join(process.cwd(), 'bucket');
    const filePath = join(bucketPath, filename);

    // Ensure the resolved path is still within bucket directory (additional security)
    if (!filePath.startsWith(bucketPath)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check file size before reading
    const stats = await import('fs/promises').then((fs) => fs.stat(filePath));
    if (stats.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    // 7. Read and serve file with security headers
    const fileBuffer = await readFile(filePath);
    const contentType = getContentType(filename);

    // Security headers for file serving
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'private, max-age=3600', // Private cache for 1 hour
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'none'",
    });

    return new NextResponse(fileBuffer as unknown as ReadableStream, {
      status: 200,
      headers,
    });
  }
);
