import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Query users from the database using Prisma
    const users = await prisma.user.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users from database', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
