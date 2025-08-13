import { NextRequest, NextResponse } from 'next/server';
import { requireUploadPermission } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { WorkspaceStatus } from '@prisma/client';
import { z } from 'zod';
import { CSRFProtection } from '@/lib/csrf';
import { rateLimiters } from '@/lib/rate-limit';
import { RequestLimits, requestLimits } from '@/lib/request-limits';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Input validation schema
const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(50, 'Slug too long').regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().max(500, 'Description too long').optional(),
});

export async function POST(request: NextRequest) {
  return RequestLimits.withRequestLimits(async () => {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.sensitive.isRateLimited(request);
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        { status: 429 }
      );
    }

    // Increment rate limit counter
    await rateLimiters.sensitive.increment(request);

    try {
      // Get session for CSRF validation
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Validate CSRF token
      const csrfToken = request.headers.get('x-csrf-token');
      if (!csrfToken || !await CSRFProtection.validateToken(session.user.id, csrfToken)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }

      console.log('🔧 Workspace creation API called');
      
      const user = await requireUploadPermission();
      console.log('✅ User authenticated:', { id: user.id, role: user.role, email: user.email });

      const body = await request.json();
      console.log('📝 Request body:', body);
      
      // Validate and sanitize input
      const validationResult = createWorkspaceSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Invalid input data',
            details: validationResult.error.issues.map((e: any) => e.message)
          },
          { status: 400 }
        );
      }

      const { name, slug, description } = validationResult.data;

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
