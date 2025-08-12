import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(request: NextRequest) {
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

    // Get user role
    const userRole = (session.user as any)?.role;
    
    // Check if user has permission to delete photos
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'BUSINESS_OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find photos and verify ownership/access
    const photos = await prisma.photo.findMany({
      where: { 
        id: { in: photoIds.map(id => parseInt(id)) }
      },
      include: {
        workspace: {
          include: {
            users: {
              select: { id: true, role: true }
            }
          }
        },
        uploadedBy: {
          select: { id: true }
        }
      }
    });

    if (photos.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 });
    }

    // Filter photos user can delete
    const deletablePhotoIds = photos
      .filter(photo => {
        return userRole === 'SUPER_ADMIN' || 
               photo.uploadedById === session.user.id ||
               photo.workspace.users.some(user => 
                 user.id === session.user.id && user.role === 'BUSINESS_OWNER'
               );
      })
      .map(photo => photo.id);

    if (deletablePhotoIds.length === 0) {
      return NextResponse.json({ 
        error: 'You do not have permission to delete any of the selected photos' 
      }, { status: 403 });
    }

    // Delete photo selections first (cascade delete)
    await prisma.photoSelection.deleteMany({
      where: { photoId: { in: deletablePhotoIds } }
    });

    // Delete the photos
    const deleteResult = await prisma.photo.deleteMany({
      where: { id: { in: deletablePhotoIds } }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deleteResult.count} photos`,
      deletedCount: deleteResult.count,
      requestedCount: photoIds.length
    });

  } catch (error) {
    console.error('Error bulk deleting photos:', error);
    return NextResponse.json(
      { error: 'Failed to delete photos' },
      { status: 500 }
    );
  }
}
