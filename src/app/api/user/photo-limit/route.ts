import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPhotoLimit } from '@/lib/subscription';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Input validation schema
const photoLimitSchema = z.object({
  workspaceId: z.string()
    .uuid('Invalid workspace ID format')
});

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/user/photo-limit - Starting request processing');

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ No authentication found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('✅ User authenticated:', userId);

    // 2. Input validation
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      console.log('❌ Missing workspace ID');
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    console.log('✅ Workspace ID provided:', workspaceId);

    // 3. Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, workspaceId: true }
    });

    if (!dbUser) {
      console.log('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User found:', dbUser.role);

    // 4. Authorization check - SUPER_ADMIN can access any workspace
    const hasAccess = 
      dbUser.role === 'SUPER_ADMIN' || 
      dbUser.workspaceId === workspaceId;

    if (!hasAccess) {
      console.log('❌ Access denied to workspace');
      return NextResponse.json({ error: 'Access denied to this workspace' }, { status: 403 });
    }

    console.log('✅ Access granted');

    // 5. Check photo limit
    const limitCheck = await checkPhotoLimit(workspaceId, userId);
    console.log('✅ Photo limit check completed:', limitCheck);

    return NextResponse.json({
      success: true,
      ...limitCheck
    });

  } catch (error) {
    console.error('❌ API Route Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('workspace not found')) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      if (error.message.includes('subscription')) {
        return NextResponse.json({ error: 'Subscription information unavailable' }, { status: 503 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to check photo limit', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
