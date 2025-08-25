import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Input validation schema
const workspacePhotosSchema = z.object({
  workspaceId: z
    .string()
    .regex(
      /^c[a-z0-9]{24}$/,
      'Invalid workspace ID format - must be a valid CUID'
    ),
});

// Pagination and filtering schema
const querySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be positive')
    .optional()
    .default(() => 1),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default(() => 30),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 3. Input validation
    const validationResult = workspacePhotosSchema.safeParse({
      workspaceId: params.workspaceId,
    });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid workspace ID format',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    const { workspaceId } = validationResult.data;
    const userRole = (session.user as any)?.role as UserRole;

    // 4. Query parameter validation
    const { searchParams } = new URL(request.url);
    const queryValidation = querySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '30',
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryValidation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    const { page, limit } = queryValidation.data;

    // 5. Verify user has access to this workspace
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 6. Authorization check with workspace access control
    const hasAccess =
      userRole === UserRole.SUPER_ADMIN || // Super admin can access all
      user.workspaceId === workspaceId || // User is assigned to this workspace
      (userRole === UserRole.BUSINESS_OWNER &&
        user.workspace?.id === workspaceId); // Business owner owns this workspace

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this workspace' },
        { status: 403 }
      );
    }

    // 7. Fetch photos for the workspace with pagination
    const skip = (page - 1) * limit;

    try {
      const [photos, totalCount] = await Promise.all([
        prisma.photo.findMany({
          where: { workspaceId },
          include: {
            uploadedBy: {
              select: {
                name: true,
                email: true,
              },
            },
            selections: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.photo.count({
          where: { workspaceId },
        }),
      ]);

      // 8. Return paginated response with metadata
      return NextResponse.json({
        success: true,
        photos,
        workspace: {
          id: user.workspace?.id,
          name: user.workspace?.name,
          slug: user.workspace?.slug,
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      // Handle specific database errors
      if (error instanceof Error) {
        if (error.message.includes('connection')) {
          return NextResponse.json(
            { error: 'Database connection error' },
            { status: 503 }
          );
        }
      }

      // Generic error for unexpected cases
      return NextResponse.json(
        { error: 'Failed to fetch workspace photos' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(
      '❌ Error in GET /api/photos/workspace/[workspaceId]:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
