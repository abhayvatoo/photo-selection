import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStorageInfo } from '@/lib/storage';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { UserRole } from '@prisma/client';
import { withErrorHandler } from '@/lib/error-handling';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    // 1. Rate limiting for storage status requests
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.general);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as UserRole;

    // 3. Authorization check - only authenticated users can view storage status
    // SUPER_ADMIN gets detailed storage info, others get limited info
    try {
      const storageInfo = getStorageInfo();
      
      // 4. Return appropriate storage information based on user role
      if (userRole === UserRole.SUPER_ADMIN) {
        // Admin gets full storage details
        return NextResponse.json({
          storage: storageInfo,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Regular users get basic storage configuration info only
        return NextResponse.json({
          storage: {
            type: storageInfo.type,
            configured: storageInfo.configured
          },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      // Don't expose internal storage details in errors
      return NextResponse.json({ error: 'Unable to retrieve storage information' }, { status: 500 });
    }
  });
}
