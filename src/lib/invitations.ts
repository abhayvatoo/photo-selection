import { prisma } from './db';
import { UserRole, InvitationStatus } from '@prisma/client';
import crypto from 'crypto';

// Generate secure random token
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create invitation
export async function createInvitation({
  email,
  role,
  workspaceId,
  invitedById,
  expiresInHours = 72, // 3 days default
}: {
  email: string;
  role: UserRole;
  workspaceId?: string;
  invitedById: string;
  expiresInHours?: number;
}) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Check if there's already a pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      email,
      status: InvitationStatus.PENDING,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (existingInvitation) {
    throw new Error('Pending invitation already exists for this email');
  }

  // Validate permissions
  const inviter = await prisma.user.findUnique({
    where: { id: invitedById },
  });

  if (!inviter) {
    throw new Error('Inviter not found');
  }

  // Permission checks
  if (role === UserRole.SUPER_ADMIN) {
    throw new Error('Cannot invite Super Admin users');
  }

  if (role === UserRole.BUSINESS_OWNER && inviter.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Only Super Admin can invite Business Owners');
  }

  if ((role === UserRole.STAFF || role === UserRole.USER) && 
      inviter.role !== UserRole.SUPER_ADMIN && 
      inviter.role !== UserRole.BUSINESS_OWNER) {
    throw new Error('Only Super Admin or Business Owner can invite Staff/Users');
  }

  // For STAFF and USER, workspace is required
  if ((role === UserRole.STAFF || role === UserRole.USER) && !workspaceId) {
    throw new Error('Workspace is required for Staff and User invitations');
  }

  // Validate workspace ownership for Business Owners
  if (workspaceId && inviter.role === UserRole.BUSINESS_OWNER) {
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        users: {
          some: {
            id: invitedById,
            role: UserRole.BUSINESS_OWNER,
          },
        },
      },
    });

    if (!workspace) {
      throw new Error('You can only invite users to workspaces you own');
    }
  }

  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const invitation = await prisma.invitation.create({
    data: {
      token,
      email,
      role,
      workspaceId,
      invitedById,
      expiresAt,
    },
    include: {
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      workspace: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  return invitation;
}

// Accept invitation
export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      workspace: true,
    },
  });

  if (!invitation) {
    throw new Error('Invalid invitation token');
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new Error('Invitation is no longer valid');
  }

  if (invitation.expiresAt < new Date()) {
    // Mark as expired
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    throw new Error('Invitation has expired');
  }

  // Get the user who's accepting
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.email !== invitation.email) {
    throw new Error('Invitation email does not match user email');
  }

  // Update user role and workspace
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: invitation.role,
      workspaceId: invitation.workspaceId,
    },
  });

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
      acceptedById: userId,
    },
  });

  return {
    user: updatedUser,
    invitation,
  };
}

// Get invitation by token (for preview)
export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      workspace: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  // Don't return expired or used invitations
  if (invitation.status !== InvitationStatus.PENDING || invitation.expiresAt < new Date()) {
    return null;
  }

  return invitation;
}

// Revoke invitation
export async function revokeInvitation(invitationId: string, revokedById: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  // Check permissions
  const revoker = await prisma.user.findUnique({
    where: { id: revokedById },
  });

  if (!revoker) {
    throw new Error('User not found');
  }

  // Only the inviter, super admin, or business owner can revoke
  if (invitation.invitedById !== revokedById && 
      revoker.role !== UserRole.SUPER_ADMIN &&
      revoker.role !== UserRole.BUSINESS_OWNER) {
    throw new Error('Insufficient permissions to revoke invitation');
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.REVOKED },
  });

  return true;
}

// Clean up expired invitations (run as cron job)
export async function cleanupExpiredInvitations() {
  const result = await prisma.invitation.updateMany({
    where: {
      status: InvitationStatus.PENDING,
      expiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: InvitationStatus.EXPIRED,
    },
  });

  return result.count;
}
