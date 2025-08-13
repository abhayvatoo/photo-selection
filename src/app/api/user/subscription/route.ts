import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Rate limiting for subscription data access
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

    // 3. Get user subscription with error handling
    try {
      const subscription = await getUserSubscription(userId);

      // 4. Return sanitized subscription data
      if (!subscription) {
        return NextResponse.json({ 
          success: true,
          subscription: null,
          message: 'No active subscription found'
        });
      }

      // Sanitize subscription data - remove sensitive information
      const sanitizedSubscription = {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        user: {
          id: subscription.user.id,
          email: subscription.user.email,
          name: subscription.user.name,
          role: subscription.user.role
        }
      };

      return NextResponse.json({ 
        success: true,
        subscription: sanitizedSubscription
      });

    } catch (error) {
      // Handle specific subscription errors
      if (error instanceof Error) {
        if (error.message.includes('user not found')) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        if (error.message.includes('stripe')) {
          return NextResponse.json({ error: 'Payment service unavailable' }, { status: 503 });
        }
      }
      
      // Generic error for unexpected cases
      return NextResponse.json({ error: 'Failed to fetch subscription information' }, { status: 500 });
    }
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
