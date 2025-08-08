import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { email, name, role, workspaceId } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Validate workspace if provided
    if (workspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        );
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role: role as UserRole,
        workspaceId: workspaceId || null,
        color: '#3B82F6',
      },
      include: {
        workspace: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const role = searchParams.get('role');

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (role) where.role = role as UserRole;

    const users = await prisma.user.findMany({
      where,
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        uploadedPhotos: {
          select: {
            id: true,
          },
        },
        selections: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            uploadedPhotos: true,
            selections: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
