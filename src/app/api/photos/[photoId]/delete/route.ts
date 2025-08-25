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

// Input validation schema
const deletePhotoSchema = z.object({
  photoId: z
    .string()
    .regex(/^\d+$/, 'Photo ID must be a number')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Photo ID must be positive'),
});

export const DELETE = withErrorHandler(
  async (request: NextRequest, { params }: { params: { photoId: string } }) => {
    // 1. Rate limiting for destructive operations
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

      // 4. Input validation
      const validationResult = deletePhotoSchema.safeParse({
        photoId: params.photoId,
      });
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid photo ID format',
            details: validationResult.error.issues.map(
              (issue) => issue.message
            ),
          },
          { status: 400 }
        );
      }

      const photoId = validationResult.data.photoId;
      const userId = session.user.id;
      const userRole = (session.user as any)?.role as UserRole;

      // 5. Permission check - only certain roles can delete photos
      if (
        userRole !== UserRole.SUPER_ADMIN &&
        userRole !== UserRole.BUSINESS_OWNER
      ) {
        return NextResponse.json(
          { error: 'Insufficient permissions to delete photos' },
          { status: 403 }
        );
      }

      // 6. Find photo and verify access with workspace isolation
      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
        include: {
          workspace: {
            include: {
              users: {
                select: { id: true, role: true },
              },
            },
          },
          uploadedBy: {
            select: { id: true },
          },
        },
      });

      if (!photo) {
        return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
      }

      // 7. Authorization check with workspace access control
      const canDelete =
        userRole === UserRole.SUPER_ADMIN ||
        photo.uploadedById === userId ||
        photo.workspace.users.some(
          (user) => user.id === userId && user.role === UserRole.BUSINESS_OWNER
        );

      if (!canDelete) {
        return NextResponse.json(
          {
            error: 'Access denied - insufficient permissions for this photo',
          },
          { status: 403 }
        );
      }

      // 8. Delete photo with transaction for data integrity
      try {
        await prisma.$transaction(async (tx) => {
          // Delete all photo selections first (cascade delete)
          await tx.photoSelection.deleteMany({
            where: { photoId: photoId },
          });

          // Delete the photo
          await tx.photo.delete({
            where: { id: photoId },
          });
        });

        // 9. Return success response
        return NextResponse.json({
          success: true,
          message: 'Photo deleted successfully',
        });
      } catch (error) {
        // Handle specific deletion errors
        if (error instanceof Error) {
          if (error.message.includes('foreign key constraint')) {
            return NextResponse.json(
              { error: 'Cannot delete photo - it has associated data' },
              { status: 409 }
            );
          }
        }

        // Generic error for unexpected cases
        return NextResponse.json(
          { error: 'Failed to delete photo' },
          { status: 500 }
        );
      }
    });
  }
);
