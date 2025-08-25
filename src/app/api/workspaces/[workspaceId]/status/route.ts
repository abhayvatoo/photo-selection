import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
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
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Check permissions - only SUPER_ADMIN and BUSINESS_OWNER can change status
    if (dbUser.role !== 'SUPER_ADMIN' && dbUser.role !== 'BUSINESS_OWNER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Validate workspace ID format (CUID)
    if (!params.workspaceId.match(/^c[a-z0-9]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid workspace ID format' },
        { status: 400 }
      );
    }

    // 5. Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: params.workspaceId },
      select: { id: true, name: true, status: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // 6. Parse and validate request body
    const body = await request.json();
    const validationResult = statusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validationResult.error.issues.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const { status } = validationResult.data;

    // 7. Update workspace status
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: params.workspaceId },
      data: { status },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      workspace: updatedWorkspace,
    });
  } catch (error) {
    console.error('Error updating workspace status:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace status' },
      { status: 500 }
    );
  }
}
