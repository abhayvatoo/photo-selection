import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { withCSRFProtection } from '@/lib/csrf';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Constants for bulk operations
const MAX_BULK_DELETE_SIZE = 50; // Limit bulk operations to prevent abuse

// Input validation schema
const bulkDeleteSchema = z.object({
  photoIds: z
    .array(z.number().int().positive())
    .min(1, 'At least one photo ID is required')
    .max(
      MAX_BULK_DELETE_SIZE,
      `Cannot delete more than ${MAX_BULK_DELETE_SIZE} photos at once`
    ),
});

// Validate user permissions for bulk delete
async function validateBulkDeletePermissions(
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  // Only SUPER_ADMIN and BUSINESS_OWNER can bulk delete
  if (
    userRole === UserRole.SUPER_ADMIN ||
    userRole === UserRole.BUSINESS_OWNER
  ) {
    return true;
  }

  return false;
}

// Get photos user can delete with workspace access control
async function getDeleteablePhotos(
  photoIds: number[],
  userId: string,
  userRole: UserRole
) {
  const photos = await prisma.photo.findMany({
    where: {
      id: { in: photoIds },
    },
    select: {
      id: true,
      filename: true,
      workspaceId: true,
      uploadedById: true,
      workspace: {
        select: {
          id: true,
          users: {
            where: { id: userId },
            select: { id: true, role: true },
          },
        },
      },
    },
  });

  if (userRole === UserRole.SUPER_ADMIN) {
    // Super admin can delete any photo
    return photos;
  }

  // Business owners can only delete photos in their workspace
  const userWorkspace = await prisma.user.findUnique({
    where: { id: userId },
    select: { workspaceId: true },
  });

  return photos.filter((photo) => {
    // Must be in user's workspace
    if (photo.workspaceId !== userWorkspace?.workspaceId) {
      return false;
    }

    // Business owner can delete photos in their workspace
    if (userRole === UserRole.BUSINESS_OWNER) {
      return true;
    }

    // Other users can only delete their own uploads
    return photo.uploadedById === userId;
  });
}

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  // 1. Rate limiting - strict for destructive operations
  const rateLimitResponse = await applyRateLimit(
    request,
    rateLimiters.sensitive
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // 2. CSRF protection
  return withCSRFProtection(request, async () => {
    // 3. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = (session.user as any)?.role as UserRole;

    // 4. Permission check
    const hasPermission = await validateBulkDeletePermissions(userId, userRole);
    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions for bulk delete operation',
        },
        { status: 403 }
      );
    }

    // 5. Input validation
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validationResult = bulkDeleteSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    const { photoIds } = validationResult.data;

    // 6. Get photos user can delete with workspace access control
    const deletablePhotos = await getDeleteablePhotos(
      photoIds,
      userId,
      userRole
    );

    if (deletablePhotos.length === 0) {
      return NextResponse.json(
        {
          error:
            'No photos found or insufficient permissions to delete selected photos',
        },
        { status: 404 }
      );
    }

    const deletablePhotoIds = deletablePhotos.map((photo) => photo.id);

    // 7. Perform deletion in transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Delete photo selections first (cascade delete)
      await tx.photoSelection.deleteMany({
        where: { photoId: { in: deletablePhotoIds } },
      });

      // Delete the photos
      const deleteResult = await tx.photo.deleteMany({
        where: { id: { in: deletablePhotoIds } },
      });

      return deleteResult;
    });

    // 8. Return success response without exposing internal details
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} photo${result.count !== 1 ? 's' : ''}`,
      deletedCount: result.count,
      requestedCount: photoIds.length,
    });
  });
});
