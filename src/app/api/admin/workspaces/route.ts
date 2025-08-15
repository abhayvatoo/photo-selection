import { NextRequest, NextResponse } from 'next/server';
import { requireUploadPermission } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { WorkspaceStatus } from '@prisma/client';
import { z } from 'zod';
import { CSRFProtection } from '@/lib/csrf';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { RequestLimits, requestLimits } from '@/lib/request-limits';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handling';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Input validation schema
const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(50, 'Slug too long').regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().max(500, 'Description too long').optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/admin/workspaces - Starting request processing');

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ No authentication found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', session.user.id);

    // 2. Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, email: true }
    });

    if (!dbUser) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', dbUser.role);

    // 3. Check permissions - SUPER_ADMIN can create workspaces
    if (dbUser.role !== 'SUPER_ADMIN' && dbUser.role !== 'BUSINESS_OWNER') {
      console.log('❌ Insufficient permissions:', dbUser.role);
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    console.log('✅ Permission check passed');

    // 4. Parse request body
    const body = await request.json();
    console.log('✅ Request body parsed:', body);
    
    // 5. Validate input
    const validationResult = createWorkspaceSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error);
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.issues.map((e: any) => e.message)
        },
        { status: 400 }
      );
    }

    const { name, slug, description } = validationResult.data;
    console.log('✅ Input validated:', { name, slug, description });

    // 6. Check if slug already exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      console.log('❌ Workspace slug already exists:', slug);
      return NextResponse.json(
        { error: 'Workspace with this slug already exists' },
        { status: 409 }
      );
    }

    console.log('✅ Slug is available');

    // 7. Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description: description || null,
        status: WorkspaceStatus.ACTIVE,
      },
    });

    console.log('✅ Workspace created successfully:', workspace.id);

    return NextResponse.json({
      success: true,
      workspace
    }, { status: 201 });

  } catch (error) {
    console.error('❌ API Route Error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Workspace with this slug already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create workspace', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    // 1. Rate limiting for admin operations
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.general);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Authentication and authorization check
    const user = await requireUploadPermission();

    // 3. Fetch workspaces with sanitized data
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

    // 4. Return sanitized response
    return NextResponse.json({
      success: true,
      workspaces
    });
  });
}
