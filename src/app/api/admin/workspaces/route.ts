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

      const user = await requireUploadPermission();

      const body = await request.json();
      
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

    // Check if slug already exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      return NextResponse.json(
        { error: 'Workspace with this slug already exists' },
        { status: 409 }
      );
    }

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description: description || null,
        status: WorkspaceStatus.ACTIVE,
      },
    });

    return NextResponse.json({
      success: true,
      workspace
    }, { status: 201 });
  } catch (error) {
    // Handle specific database errors without exposing internal details
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Workspace with this slug already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
  }, requestLimits.general);
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
