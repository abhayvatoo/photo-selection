import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Constants for pagination validation
const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 1;

// Validate and sanitize pagination parameters
function validatePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      MIN_PAGE_SIZE,
      parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString()) ||
        DEFAULT_PAGE_SIZE
    )
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// Get user's accessible workspaces
async function getUserWorkspaces(
  userId: string,
  userRole: UserRole
): Promise<{ id: string }[]> {
  if (userRole === UserRole.SUPER_ADMIN) {
    // Super admin can access all workspaces
    return await prisma.workspace.findMany({
      select: { id: true },
    });
  }

  // Regular users can only access their assigned workspace
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      workspaceId: true,
    },
  });

  if (!user?.workspaceId) {
    return [];
  }

  return [{ id: user.workspaceId }];
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  // 1. Authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Rate limiting
  const rateLimitResponse = await applyRateLimit(request, rateLimiters.general);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // 3. Input validation and sanitization
  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = validatePaginationParams(searchParams);

  // Validate and sanitize filter users
  const filterUsersParam = searchParams.get('filterUsers');
  const filterUsers = filterUsersParam
    ? filterUsersParam
        .split(',')
        .filter(Boolean)
        .filter((userId) => /^[a-zA-Z0-9-_]+$/.test(userId)) // Basic validation
        .slice(0, 10) // Limit to prevent abuse
    : [];

  // 4. Get user's accessible workspaces for authorization
  const userRole = (session.user as any)?.role as UserRole;
  const accessibleWorkspaces = await getUserWorkspaces(
    session.user.id,
    userRole
  );

  if (accessibleWorkspaces.length === 0) {
    return NextResponse.json({
      photos: [],
      total: 0,
      page,
      limit,
      hasMore: false,
    });
  }

  // 5. Build secure where clause with workspace access control
  const workspaceIds = accessibleWorkspaces.map((w) => w.id);
  let whereClause: any = {
    workspaceId: { in: workspaceIds },
  };

  // Add user filtering if specified
  if (filterUsers.length > 0) {
    whereClause.AND = filterUsers.map((userId) => ({
      selections: {
        some: {
          userId: userId,
        },
      },
    }));
  }

  // 6. Get total count for pagination
  const totalCount = await prisma.photo.count({
    where: whereClause,
  });

  // 7. Query photos with proper workspace isolation
  const photos = await prisma.photo.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
    skip: offset,
    take: limit,
    select: {
      id: true,
      filename: true,
      originalName: true,
      url: true,
      mimeType: true,
      size: true,
      createdAt: true,
      workspaceId: true,
      selections: {
        select: {
          id: true,
          userId: true,
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
    photos,
    total: totalCount,
    page,
    limit,
    hasMore: offset + photos.length < totalCount,
  });
});
