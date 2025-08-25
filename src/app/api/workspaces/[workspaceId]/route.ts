import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, workspaceId: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Validate workspace ID format (CUID)
    if (!params.workspaceId.match(/^c[a-z0-9]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid workspace ID format' },
        { status: 400 }
      );
    }

    // 4. Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: params.workspaceId },
      select: { id: true, name: true, slug: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // 5. Check permissions - only SUPER_ADMIN and BUSINESS_OWNER can edit
    // BUSINESS_OWNER can only edit their own workspace
    if (dbUser.role === 'SUPER_ADMIN') {
      // Super admin can edit any workspace
    } else if (dbUser.role === 'BUSINESS_OWNER') {
      // Business owner can only edit their assigned workspace
      if (dbUser.workspaceId !== params.workspaceId) {
        return NextResponse.json(
          { error: 'You can only edit your assigned workspace' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this workspace' },
        { status: 403 }
      );
    }

    // 6. Parse and validate request body
    const body = await request.json();
    const validationResult = updateWorkspaceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validationResult.error.issues.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const { name, description } = validationResult.data;

    // 7. Generate slug from name (check if it would conflict)
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists (excluding current workspace)
    if (slug !== workspace.slug) {
      const existingWorkspace = await prisma.workspace.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existingWorkspace && existingWorkspace.id !== params.workspaceId) {
        return NextResponse.json(
          { error: 'A workspace with this name already exists' },
          { status: 409 }
        );
      }
    }

    // 8. Update workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: params.workspaceId },
      data: {
        name,
        description: description || null,
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      workspace: updatedWorkspace,
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}