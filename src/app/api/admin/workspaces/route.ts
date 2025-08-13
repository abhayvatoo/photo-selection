import { NextRequest, NextResponse } from 'next/server';
import { requireUploadPermission } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { WorkspaceStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Workspace creation API called');
    
    const user = await requireUploadPermission();
    console.log('✅ User authenticated:', { id: user.id, role: user.role, email: user.email });

    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const { name, slug, description } = body;

    if (!name || !slug) {
      console.log('❌ Validation failed: missing name or slug');
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking for existing workspace with slug:', slug);
    
    // Check if slug already exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      console.log('❌ Workspace with slug already exists:', slug);
      return NextResponse.json(
        { error: 'Workspace with this slug already exists' },
        { status: 409 }
      );
    }

    console.log('🚀 Creating workspace with data:', {
      name,
      slug,
      description: description || null,
      status: WorkspaceStatus.ACTIVE,
    });

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description: description || null,
        status: WorkspaceStatus.ACTIVE,
      },
    });

    console.log('✅ Workspace created successfully:', workspace);
    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating workspace:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Failed to create workspace',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUploadPermission();

    const workspaces = await prisma.workspace.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        photos: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            users: true,
            photos: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}
