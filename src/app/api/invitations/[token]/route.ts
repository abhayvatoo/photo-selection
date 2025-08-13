import { NextRequest, NextResponse } from 'next/server';
import { getInvitationByToken } from '@/lib/invitations';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { withErrorHandler } from '@/lib/error-handling';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Input validation schema
const tokenSchema = z.object({
  token: z.string()
    .min(32, 'Token must be at least 32 characters')
    .max(128, 'Token too long')
    .regex(/^[a-zA-Z0-9]+$/, 'Token contains invalid characters')
});

// Validate token format
function validateTokenFormat(token: string): boolean {
  try {
    tokenSchema.parse({ token });
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  return withErrorHandler(async () => {
    // 1. Rate limiting for invitation token validation
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.invitation);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Input validation
    const { token } = params;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid token parameter' }, { status: 400 });
    }

    // 3. Token format validation
    if (!validateTokenFormat(token)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    // 4. Get invitation with security checks
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    // 5. Return sanitized invitation data (no sensitive information)
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        workspace: invitation.workspace ? {
          name: invitation.workspace.name,
          slug: invitation.workspace.slug
        } : null
      },
    });
  });
}
