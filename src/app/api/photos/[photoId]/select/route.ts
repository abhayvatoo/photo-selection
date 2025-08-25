import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { withCSRFProtection } from '@/lib/csrf';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Validate photo access for user
async function validatePhotoAccess(
  photoId: number,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      workspaceId: true,
      workspace: {
        select: {
          users: {
            where: { id: userId },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!photo) {
    return false;
  }

  // Super admin can access any photo
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Check if user belongs to the photo's workspace
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workspaceId: true },
  });

  return user?.workspaceId === photo.workspaceId;
}

export const POST = withErrorHandler(
  async (request: NextRequest, { params }: { params: { photoId: string } }) => {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(
      request,
      rateLimiters.general
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Apply CSRF protection
    return withCSRFProtection(request, async () => {
      // 1. Authentication check
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const { photoId } = params;
      const userId = session.user.id;
      const userRole = (session.user as any)?.role as UserRole;

      // 2. Input validation
      if (!photoId || typeof photoId !== 'string') {
        return NextResponse.json(
          { error: 'Valid photo ID is required' },
          { status: 400 }
        );
      }

      // Convert photoId from string to integer with validation
      const photoIdInt = parseInt(photoId);
      if (isNaN(photoIdInt) || photoIdInt <= 0) {
        return NextResponse.json(
          { error: 'Invalid photo ID format' },
          { status: 400 }
        );
      }

      // 3. Workspace access control
      const hasAccess = await validatePhotoAccess(photoIdInt, userId, userRole);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to this photo' },
          { status: 403 }
        );
      }

      // 4. Check if selection already exists
      const existingSelection = await prisma.photoSelection.findUnique({
        where: {
          photoId_userId: {
            photoId: photoIdInt,
            userId,
          },
        },
      });

      let selected = false;

      if (existingSelection) {
        // Remove selection
        await prisma.photoSelection.delete({
          where: { id: existingSelection.id },
        });
        selected = false;
      } else {
        // Add selection
        await prisma.photoSelection.create({
          data: {
            id: randomUUID(),
            photoId: photoIdInt,
            userId,
          },
        });
        selected = true;
      }

      // 5. Get updated photo with selections (with workspace filtering)
      const photo = await prisma.photo.findUnique({
        where: { id: photoIdInt },
        select: {
          id: true,
          filename: true,
          originalName: true,
          url: true,
          mimeType: true,
          size: true,
          createdAt: true,
          updatedAt: true,
          workspaceId: true,
          selections: {
            select: {
              id: true,
              userId: true,
              createdAt: true,
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

      return NextResponse.json({
        selected,
        photo,
        message: `Photo ${selected ? 'selected' : 'deselected'} successfully`,
      });
    });
  }
);

export const DELETE = withErrorHandler(
  async (request: NextRequest, { params }: { params: { photoId: string } }) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoId } = params;
    const userId = session.user.id;

    if (!photoId) {
      return NextResponse.json(
        { error: 'PhotoId is required' },
        { status: 400 }
      );
    }

    // Convert photoId from string to integer
    const photoIdInt = parseInt(photoId);
    if (isNaN(photoIdInt)) {
      return NextResponse.json(
        { error: 'Invalid photoId format' },
        { status: 400 }
      );
    }

    // Remove selection if it exists
    const existingSelection = await prisma.photoSelection.findUnique({
      where: {
        photoId_userId: {
          photoId: photoIdInt,
          userId,
        },
      },
    });

    if (existingSelection) {
      await prisma.photoSelection.delete({
        where: { id: existingSelection.id },
      });
    }

    // Get updated photo with selections
    const photo = await prisma.photo.findUnique({
      where: { id: photoIdInt },
      select: {
        id: true,
        filename: true,
        originalName: true,
        url: true,
        mimeType: true,
        size: true,
        createdAt: true,
        updatedAt: true,
        selections: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
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

    return NextResponse.json({
      selected: false,
      photo,
      message: 'Photo deselected successfully',
    });
  }
);
