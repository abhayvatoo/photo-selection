import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const { userId } = await request.json();
    const { photoId } = params;

    if (!userId || !photoId) {
      return NextResponse.json(
        { error: 'UserId and photoId are required' },
        { status: 400 }
      );
    }

    // Check if selection already exists
    const existingSelection = await prisma.photoSelection.findUnique({
      where: {
        photoId_userId: {
          photoId,
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
          photoId,
          userId,
        },
      });
      selected = true;
    }

    // Get updated photo with selections
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        selections: {
          include: {
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
