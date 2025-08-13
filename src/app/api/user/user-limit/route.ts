import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkUserLimit } from '@/lib/subscription';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Input validation schema
const userLimitSchema = z.object({
  workspaceId: z.string()
    .uuid('Invalid workspace ID format')
});

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    // 1. Rate limiting for limit checking
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.general);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user as any)?.role as UserRole;

    // 3. Input validation
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const validationResult = userLimitSchema.safeParse({ workspaceId });
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid workspace ID format',
        details: validationResult.error.issues.map(issue => issue.message)
      }, { status: 400 });
    }

    // 4. Workspace access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 5. Authorization check - ensure user can access this workspace
    const hasAccess = 
      userRole === UserRole.SUPER_ADMIN || // Super admin can check any workspace
      user.workspaceId === workspaceId; // User can check their own workspace

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this workspace' }, { status: 403 });
    }

    // 6. Check user limit with error handling
    try {
      const limitCheck = await checkUserLimit(workspaceId, userId);

      // 7. Return sanitized response
      return NextResponse.json({
        success: true,
        ...limitCheck
      });

    } catch (error) {
      // Handle specific limit check errors
      if (error instanceof Error) {
        if (error.message.includes('workspace not found')) {
          return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }
        if (error.message.includes('subscription')) {
          return NextResponse.json({ error: 'Subscription information unavailable' }, { status: 503 });
        }
      }
      
      // Generic error for unexpected cases
      return NextResponse.json({ error: 'Failed to check user limit' }, { status: 500 });
    }
  });
}
