import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const photoId = parseInt(params.photoId);
    if (isNaN(photoId)) {
      return NextResponse.json({ error: 'Invalid photo ID' }, { status: 400 });
    }

    // Get user role
    const userRole = (session.user as any)?.role;
    
    // Check if user has permission to delete photos
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'BUSINESS_OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find the photo and verify ownership/access
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
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

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check permissions:
    // - SUPER_ADMIN can delete any photo
    // - BUSINESS_OWNER can delete photos in their workspaces or photos they uploaded
    const canDelete = userRole === 'SUPER_ADMIN' || 
                     photo.uploadedById === session.user.id ||
                     photo.workspace.users.some(user => 
                       user.id === session.user.id && user.role === 'BUSINESS_OWNER'
                     );

    if (!canDelete) {
      return NextResponse.json({ 
        error: 'You can only delete photos you uploaded or photos in your workspaces' 
      }, { status: 403 });
    }

    // Delete all photo selections first (cascade delete)
    await prisma.photoSelection.deleteMany({
      where: { photoId: photoId }
    });

    // Delete the photo
    await prisma.photo.delete({
      where: { id: photoId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Photo deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
