import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createInvitation } from '@/lib/invitations';
import { emailService } from '@/lib/email-service';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { withCSRFProtection } from '@/lib/csrf';
import { withErrorHandler } from '@/lib/error-handling';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Input validation schema
const createInvitationSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long'),
  role: z.nativeEnum(UserRole),
  workspaceId: z.string()
    .uuid('Invalid workspace ID format')
    .optional()
});

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 1. Rate limiting for invitation creation
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.invitation);
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

      const validationResult = createInvitationSchema.safeParse(requestBody);
      if (!validationResult.success) {
        return NextResponse.json({ 
          error: 'Invalid input', 
          details: validationResult.error.issues.map(issue => issue.message)
        }, { status: 400 });
      }

      const { email, role, workspaceId } = validationResult.data;

      // 5. Create invitation with comprehensive error handling
      try {
        const invitation = await createInvitation({
          email,
          role,
          workspaceId,
          invitedById: session.user.id,
        });

        // Generate invitation URL
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const invitationUrl = `${baseUrl}/invite/${invitation.token}`;

        // Get workspace and inviter information for email
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { name: true }
        });

        const inviter = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, email: true }
        });

        // Send invitation email
        const emailResult = await emailService.sendInvitationEmail(email, {
          inviteeName: email.split('@')[0], // Use email prefix as name fallback
          inviterName: inviter?.name || inviter?.email || 'Someone',
          workspaceName: workspace?.name || 'Photo Workspace',
          role: role,
          inviteUrl: invitationUrl,
          expiresAt: invitation.expiresAt,
        });

        // 6. Return sanitized response data
        return NextResponse.json({
          success: true,
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
            invitationUrl: process.env.NODE_ENV === 'development' ? invitationUrl : undefined,
          },
          emailSent: emailResult.success,
          emailError: emailResult.error,
        });

      } catch (error) {
        // Handle specific invitation creation errors
        if (error instanceof Error) {
          if (error.message.includes('already exists')) {
            return NextResponse.json({ error: 'Invitation already exists for this email' }, { status: 409 });
          }
          if (error.message.includes('permission')) {
            return NextResponse.json({ error: 'Insufficient permissions to create invitation' }, { status: 403 });
          }
        }
        
        // Generic error for unexpected cases
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
      }
    });
  });
}
