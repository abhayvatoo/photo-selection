import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkWorkspaceLimit } from '@/lib/subscription';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { withErrorHandler } from '@/lib/error-handling';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

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

    // 3. Check workspace limit with error handling
    try {
      const limitCheck = await checkWorkspaceLimit(userId);

      // 4. Return sanitized response
      return NextResponse.json({
        success: true,
        ...limitCheck
      });

    } catch (error) {
      // Handle specific limit check errors without exposing internal details
      if (error instanceof Error) {
        if (error.message.includes('user not found')) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        if (error.message.includes('subscription')) {
          return NextResponse.json({ error: 'Subscription information unavailable' }, { status: 503 });
        }
      }
      
      // Generic error for unexpected cases
      return NextResponse.json({ error: 'Failed to check workspace limit' }, { status: 500 });
    }
  });
}
