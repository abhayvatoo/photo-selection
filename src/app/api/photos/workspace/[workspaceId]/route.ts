import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = params;

    // Verify user has access to this workspace
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workspace: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = 
      user.role === 'SUPER_ADMIN' || // Super admin can access all
      user.workspaceId === workspaceId || // User is assigned to this workspace
      (user.role === 'BUSINESS_OWNER' && user.workspace?.id === workspaceId); // Business owner owns this workspace

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this workspace' }, { status: 403 });
    }

    // Fetch photos for the workspace
    const photos = await prisma.photo.findMany({
      where: { workspaceId },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        selections: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      photos,
      workspace: user.workspace,
    });

  } catch (error) {
    console.error('Error fetching workspace photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
