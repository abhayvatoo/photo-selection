import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createInvitation } from '@/lib/invitations';
import { UserRole } from '@prisma/client';

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

    // In production, you would send an email here
    // For development, we'll return the URL
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        invitationUrl: process.env.NODE_ENV === 'development' ? invitationUrl : undefined,
      },
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
