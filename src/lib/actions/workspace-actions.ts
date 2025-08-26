'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserPlanLimits } from '@/lib/subscription';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface CreateWorkspaceData {
  name: string;
  slug: string;
  description: string;
}

export async function checkWorkspaceLimit() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    const limits = await getUserPlanLimits(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let currentWorkspaces = 0;

    if (user.role === 'SUPER_ADMIN') {
      currentWorkspaces = await prisma.workspace.count();
    } else {
      currentWorkspaces = await prisma.workspace.count({
        where: {
          users: {
            some: {
              id: session.user.id,
              role: { in: ['BUSINESS_OWNER'] },
            },
          },
        },
      });
    }

    const allowed =
      limits.maxWorkspaces === -1 || currentWorkspaces < limits.maxWorkspaces;

    return {
      allowed,
      current: currentWorkspaces,
      limit: limits.maxWorkspaces,
    };
  } catch (error) {
    console.error('Error checking workspace limit:', error);
    throw new Error('Failed to check workspace limit');
  }
}

export async function createWorkspace(data: CreateWorkspaceData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  // Check workspace limit first
  const limitCheck = await checkWorkspaceLimit();
  if (!limitCheck.allowed) {
    throw new Error('Workspace creation limit reached');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BUSINESS_OWNER') {
      throw new Error('Insufficient permissions to create workspace');
    }

    // Check if slug is already taken
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug: data.slug },
    });

    if (existingWorkspace) {
      throw new Error('Workspace slug is already taken');
    }

    // Create the workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        users: {
          connect: { id: session.user.id },
        },
      },
    });

    // Update user role to BUSINESS_OWNER if they're not SUPER_ADMIN
    if (user.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          role: 'BUSINESS_OWNER',
          workspaceId: workspace.id,
        },
      });
    }

    // Revalidate relevant paths
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/workspace/${workspace.slug}`);

    return { success: true, workspace };
  } catch (error) {
    console.error('Error creating workspace:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to create workspace');
  }
}
