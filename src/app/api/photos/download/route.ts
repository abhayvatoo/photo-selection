import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoIds } = await request.json();

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: 'Photo IDs array is required' },
        { status: 400 }
      );
    }

    // Fetch photos that the user has selected
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: photoIds },
        selections: {
          some: {
            userId: session.user.id,
          },
        },
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        url: true,
        mimeType: true,
      },
    });

    if (photos.length === 0) {
      return NextResponse.json(
        { error: 'No selected photos found' },
        { status: 404 }
      );
    }

    // For now, return a simple JSON response with photo URLs
    // TODO: Implement proper ZIP download functionality with archiver package
    return NextResponse.json({
      success: true,
      message: 'Selected photos ready for download',
      photos: photos.map(photo => ({
        id: photo.id,
        filename: photo.originalName,
        url: photo.url,
        downloadUrl: photo.url, // Direct download for now
      })),
      note: 'ZIP download functionality will be implemented in a future update'
    });

  } catch (error) {
    console.error('Error creating photo download:', error);
    return NextResponse.json(
      { error: 'Failed to create download' },
      { status: 500 }
    );
  }
}
