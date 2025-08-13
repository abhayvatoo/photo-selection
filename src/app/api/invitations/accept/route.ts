import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { acceptInvitation } from '@/lib/invitations';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { withCSRFProtection } from '@/lib/csrf';
import { withErrorHandler } from '@/lib/error-handling';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Input validation schema
const acceptInvitationSchema = z.object({
  token: z.string()
    .min(32, 'Token must be at least 32 characters')
    .max(128, 'Token too long')
    .regex(/^[a-zA-Z0-9]+$/, 'Token contains invalid characters')
});

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 1. Rate limiting for invitation acceptance
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.sensitive);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. CSRF protection
    return withCSRFProtection(request, async () => {
      // 3. Authentication check
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // 4. Input validation
      let requestBody;
      try {
        requestBody = await request.json();
      } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }

      const validationResult = acceptInvitationSchema.safeParse(requestBody);
      if (!validationResult.success) {
        return NextResponse.json({ 
          error: 'Invalid input', 
          details: validationResult.error.issues.map(issue => issue.message)
        }, { status: 400 });
      }

      const { token } = validationResult.data;

      // 5. Accept invitation with comprehensive error handling
      try {
        const result = await acceptInvitation(token, session.user.id);

        // 6. Return sanitized response data
        return NextResponse.json({
          success: true,
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            workspaceId: result.user.workspaceId,
          },
          workspace: result.invitation.workspace ? {
            name: result.invitation.workspace.name,
            slug: result.invitation.workspace.slug
          } : null,
        });

      } catch (error) {
        // Handle specific invitation errors without exposing internal details
        if (error instanceof Error) {
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
          }
          if (error.message.includes('already accepted')) {
            return NextResponse.json({ error: 'Invitation already accepted' }, { status: 409 });
          }
          if (error.message.includes('email mismatch')) {
            return NextResponse.json({ error: 'Email does not match invitation' }, { status: 403 });
          }
        }
        
        // Generic error for unexpected cases
        return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
      }
    });
  });
}
