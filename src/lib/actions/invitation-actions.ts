'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createInvitation as createInvitationLib } from '@/lib/invitations';
import { getUserPlanLimits } from '@/lib/subscription';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';

interface CreateInvitationData {
  email: string;
  role: UserRole;
  workspaceId?: string;
}

export async function checkUserLimit(workspaceId?: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    const limits = await getUserPlanLimits(session.user.id);
    
    let currentUsers = 0;
    
    if (workspaceId) {
      currentUsers = await prisma.user.count({
        where: { workspaceId },
      });
    } else {
      // For super admin, count all users
      currentUsers = await prisma.user.count();
    }

    const allowed = limits.maxUsersPerWorkspace === -1 || currentUsers < limits.maxUsersPerWorkspace;

    return {
      allowed,
      current: currentUsers,
      limit: limits.maxUsersPerWorkspace,
    };
  } catch (error) {
    console.error('Error checking user limit:', error);
    throw new Error('Failed to check user limit');
  }
}

export async function createInvitation(data: CreateInvitationData) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    // Check user limit first if workspace is specified
    if (data.workspaceId) {
      const limitCheck = await checkUserLimit(data.workspaceId);
      if (!limitCheck.allowed) {
        throw new Error('User invitation limit reached for this workspace');
      }
    }

    const invitation = await createInvitationLib({
      email: data.email,
      role: data.role,
      workspaceId: data.workspaceId,
      invitedById: session.user.id,
    });

    // Revalidate relevant paths
    revalidatePath('/admin');
    revalidatePath('/invite');
    if (data.workspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: data.workspaceId },
        select: { slug: true }
      });
      if (workspace) {
        revalidatePath(`/workspace/${workspace.slug}`);
      }
    }

    return { success: true, invitation };
  } catch (error) {
    console.error('Error creating invitation:', error);
    throw error instanceof Error ? error : new Error('Failed to create invitation');
  }
}

export async function getInvitations(workspaceId?: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let whereClause: any = {
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    };

    // Apply workspace filtering based on user role
    if (user.role === 'SUPER_ADMIN') {
      if (workspaceId) {
        whereClause.workspaceId = workspaceId;
      }
    } else if (user.role === 'BUSINESS_OWNER') {
      whereClause.workspaceId = workspaceId || user.workspaceId;
    } else {
      throw new Error('Insufficient permissions to view invitations');
    }

    const invitations = await prisma.invitation.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  } catch (error) {
    console.error('Error fetching invitations:', error);
    throw new Error('Failed to fetch invitations');
  }
}

export async function revokeInvitation(invitationId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { workspace: { select: { slug: true } } }
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const canRevoke = 
      invitation.invitedById === session.user.id ||
      user.role === 'SUPER_ADMIN' ||
      (user.role === 'BUSINESS_OWNER' && invitation.workspaceId === user.workspaceId);

    if (!canRevoke) {
      throw new Error('Insufficient permissions to revoke invitation');
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    // Revalidate relevant paths
    revalidatePath('/admin');
    revalidatePath('/invite');
    if (invitation.workspace) {
      revalidatePath(`/workspace/${invitation.workspace.slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error revoking invitation:', error);
    throw error instanceof Error ? error : new Error('Failed to revoke invitation');
  }
}