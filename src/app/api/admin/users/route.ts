import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { CSRFProtection } from '@/lib/csrf';
import { rateLimiters } from '@/lib/rate-limit';
import { RequestLimits, requestLimits } from '@/lib/request-limits';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Input validation schema
const createUserSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['SUPER_ADMIN', 'BUSINESS_OWNER', 'ADMIN', 'PHOTOGRAPHER', 'CLIENT']),
  workspaceId: z.string().uuid().optional(),
});

const getUsersSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  role: z.enum(['SUPER_ADMIN', 'BUSINESS_OWNER', 'ADMIN', 'PHOTOGRAPHER', 'CLIENT']).optional(),
});

export async function POST(request: NextRequest) {
  return RequestLimits.validateRequest(request, requestLimits.auth, async () => {
    return rateLimiters.sensitive(request, async () => {
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

        await requireAdmin();

        const body = await request.json();
        
        // Validate input
        const validationResult = createUserSchema.safeParse(body);
        if (!validationResult.success) {
          return NextResponse.json(
            { 
              error: 'Invalid input data',
              details: validationResult.error.errors.map((e: any) => e.message)
            },
            { status: 400 }
          );
        }

        const { email, name, role, workspaceId } = validationResult.data;

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
    });
  });
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
