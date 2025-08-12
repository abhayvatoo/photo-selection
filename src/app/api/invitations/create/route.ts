import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createInvitation } from '@/lib/invitations';
import { emailService } from '@/lib/email-service';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, workspaceId } = body;

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

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
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
