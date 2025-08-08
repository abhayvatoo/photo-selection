import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const filterUsers = searchParams.get('filterUsers')?.split(',').filter(Boolean) || [];
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build where clause for filtering
    let whereClause: any = {};
    if (filterUsers.length > 0) {
      // For AND logic: photos must be selected by ALL filtered users
      whereClause = {
        AND: filterUsers.map(userId => ({
          selections: {
            some: {
              userId: userId
            }
          }
        }))
      };
    }
    
    // Get total count for pagination
    const totalCount = await prisma.photo.count({
      where: whereClause
    });
    
    // Query photos from the database using Prisma with pagination
    const photos = await prisma.photo.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit,
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
    
    return NextResponse.json({ 
      photos,
      total: totalCount,
      page,
      limit,
      hasMore: offset + photos.length < totalCount
    });
  } catch (error) {
    console.error('Error fetching photos from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos from database', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
