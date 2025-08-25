import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkWorkspaceLimit } from '@/lib/subscription';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('🔍 Workspace limit API called');

  try {
    // 1. Authentication check
    console.log('🔐 Checking authentication...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ No authentication found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log('✅ User authenticated:', userId);

    // 2. Check workspace limit with error handling
    try {
      console.log('📊 Checking workspace limits...');
      const limitCheck = await checkWorkspaceLimit(userId);
      console.log('✅ Workspace limit check result:', limitCheck);

      // 3. Return sanitized response
      const response = NextResponse.json({
        success: true,
        allowed: limitCheck.allowed,
        current: limitCheck.current,
        limit: limitCheck.limit,
      });

      console.log('📤 Returning response:', {
        success: true,
        allowed: limitCheck.allowed,
        current: limitCheck.current,
        limit: limitCheck.limit,
      });

      return response;
    } catch (limitError) {
      console.error('❌ Workspace limit check error:', limitError);

      // Handle specific limit check errors without exposing internal details
      if (limitError instanceof Error) {
        if (limitError.message.includes('user not found')) {
          console.log('📤 Returning user not found error');
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        if (limitError.message.includes('subscription')) {
          console.log('📤 Returning subscription error');
          return NextResponse.json(
            { error: 'Subscription information unavailable' },
            { status: 503 }
          );
        }
      }

      // Generic error for unexpected cases
      console.log('📤 Returning generic error');
      return NextResponse.json(
        { error: 'Failed to check workspace limit' },
        { status: 500 }
      );
    }
  } catch (error) {
    // Top-level error handler
    console.error('❌ API route top-level error:', error);
    console.log('📤 Returning internal server error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
