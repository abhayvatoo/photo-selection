import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Query photos from the database using Prisma
    const photos = await prisma.photo.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        url: true,
        mimeType: true,
        size: true,
        createdAt: true,
        selections: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching photos from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos from database', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
