import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

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

  // 3. Authorization check - only authenticated users can view users
  const userRole = (session.user as any)?.role as UserRole;

  let whereClause: any = {};

  if (userRole === UserRole.SUPER_ADMIN) {
    // Super admin can see all users
    whereClause = {};
  } else if (userRole === UserRole.BUSINESS_OWNER) {
    // Business owners can see users in their workspace
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true },
    });

    if (currentUser?.workspaceId) {
      whereClause = {
        workspaceId: currentUser.workspaceId,
      };
    } else {
      // No workspace access
      return NextResponse.json({ users: [] });
    }
  } else {
    // STAFF and USER roles can only see users in their workspace
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true },
    });

    if (currentUser?.workspaceId) {
      whereClause = {
        workspaceId: currentUser.workspaceId,
      };
    } else {
      // No workspace access
      return NextResponse.json({ users: [] });
    }
  }

  // 4. Query users with proper access control
  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
      color: true,
      createdAt: true,
      role: true,
      workspaceId: true,
    },
  });

  return NextResponse.json({ users });
});
