import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoId } = params;
    const userId = session.user.id;

    if (!photoId) {
      return NextResponse.json(
        { error: 'PhotoId is required' },
        { status: 400 }
      );
    }

    // Convert photoId from string to integer
    const photoIdInt = parseInt(photoId);
    if (isNaN(photoIdInt)) {
      return NextResponse.json(
        { error: 'Invalid photoId format' },
        { status: 400 }
      );
    }

    // Check if selection already exists
    const existingSelection = await prisma.photoSelection.findUnique({
      where: {
        photoId_userId: {
          photoId: photoIdInt,
          userId,
        },
      },
    });

    let selected = false;
    
    if (existingSelection) {
      // Remove selection
      await prisma.photoSelection.delete({
        where: { id: existingSelection.id },
      });
      selected = false;
    } else {
      // Add selection
      await prisma.photoSelection.create({
        data: {
          id: randomUUID(),
          photoId: photoIdInt,
          userId,
        },
      });
      selected = true;
    }

    // Get updated photo with selections
    const photo = await prisma.photo.findUnique({
      where: { id: photoIdInt },
      select: {
        id: true,
        filename: true,
        originalName: true,
        url: true,
        mimeType: true,
        size: true,
        createdAt: true,
        updatedAt: true,
        selections: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      selected, 
      photo,
      message: `Photo ${selected ? 'selected' : 'deselected'} successfully`
    });
  } catch (error) {
    console.error('Error toggling photo selection:', error);
    return NextResponse.json(
      { error: 'Failed to toggle photo selection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoId } = params;
    const userId = session.user.id;

    if (!photoId) {
      return NextResponse.json(
        { error: 'PhotoId is required' },
        { status: 400 }
      );
    }

    // Convert photoId from string to integer
    const photoIdInt = parseInt(photoId);
    if (isNaN(photoIdInt)) {
      return NextResponse.json(
        { error: 'Invalid photoId format' },
        { status: 400 }
      );
    }

    // Remove selection if it exists
    const existingSelection = await prisma.photoSelection.findUnique({
      where: {
        photoId_userId: {
          photoId: photoIdInt,
          userId,
        },
      },
    });

    if (existingSelection) {
      await prisma.photoSelection.delete({
        where: { id: existingSelection.id },
      });
    }

    // Get updated photo with selections
    const photo = await prisma.photo.findUnique({
      where: { id: photoIdInt },
      select: {
        id: true,
        filename: true,
        originalName: true,
        url: true,
        mimeType: true,
        size: true,
        createdAt: true,
        updatedAt: true,
        selections: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      selected: false, 
      photo,
      message: 'Photo deselected successfully'
    });
  } catch (error) {
    console.error('Error deselecting photo:', error);
    return NextResponse.json(
      { error: 'Failed to deselect photo' },
      { status: 500 }
    );
  }
}
