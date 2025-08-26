'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserPlanLimits } from '@/lib/subscription';
import { revalidatePath, revalidateTag } from 'next/cache';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

interface PhotoUploadData {
  workspaceId: string;
  files: File[];
}

interface PhotoSelectionData {
  photoId: number;
  workspaceId: string;
}

export async function checkPhotoLimit(workspaceId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    const limits = await getUserPlanLimits(session.user.id);
    
    const currentPhotos = await prisma.photo.count({
      where: { workspaceId },
    });

    const allowed = limits.maxPhotosPerWorkspace === -1 || currentPhotos < limits.maxPhotosPerWorkspace;

    return {
      allowed,
      current: currentPhotos,
      limit: limits.maxPhotosPerWorkspace,
    };
  } catch (error) {
    console.error('Error checking photo limit:', error);
    throw new Error('Failed to check photo limit');
  }
}

export async function uploadPhotos(data: PhotoUploadData) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    // Verify user has access to workspace
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BUSINESS_OWNER' && user.role !== 'STAFF') {
      throw new Error('Insufficient permissions to upload photos');
    }

    if (user.role !== 'SUPER_ADMIN' && user.workspaceId !== data.workspaceId) {
      throw new Error('Access denied to this workspace');
    }

    // Check photo limit
    const limitCheck = await checkPhotoLimit(data.workspaceId);
    if (!limitCheck.allowed) {
      throw new Error(`Photo limit reached. Maximum ${limitCheck.limit} photos allowed.`);
    }

    const uploadedPhotos = [];
    const bucketDir = path.join(process.cwd(), 'bucket');

    for (const file of data.files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error(`Invalid file type: ${file.name}. Only images are allowed.`);
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`File too large: ${file.name}. Maximum size is 10MB.`);
      }

      // Generate unique filename
      const fileId = nanoid(16);
      const extension = path.extname(file.name);
      const filename = `${fileId}${extension}`;
      const filePath = path.join(bucketDir, filename);

      // Convert File to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save file to disk
      await writeFile(filePath, buffer);

      // Create database record
      const photo = await prisma.photo.create({
        data: {
          filename,
          originalName: file.name,
          url: `/api/photos/serve/${filename}`,
          mimeType: file.type,
          size: file.size,
          workspaceId: data.workspaceId,
          uploadedById: session.user.id,
        },
        include: {
          uploadedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      uploadedPhotos.push(photo);
    }

    // Revalidate photo-related paths
    const workspace = await prisma.workspace.findUnique({
      where: { id: data.workspaceId },
      select: { slug: true }
    });

    if (workspace) {
      revalidatePath(`/workspace/${workspace.slug}`);
      revalidateTag(`photos-${data.workspaceId}`);
    }

    return { success: true, photos: uploadedPhotos };
  } catch (error) {
    console.error('Error uploading photos:', error);
    throw error instanceof Error ? error : new Error('Failed to upload photos');
  }
}

export async function deletePhoto(photoId: number) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { workspace: { select: { slug: true } } }
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    const canDelete = 
      user.role === 'SUPER_ADMIN' ||
      (user.role === 'BUSINESS_OWNER' && photo.workspaceId === user.workspaceId) ||
      (user.role === 'STAFF' && photo.workspaceId === user.workspaceId);

    if (!canDelete) {
      throw new Error('Insufficient permissions to delete photo');
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'bucket', photo.filename);
    try {
      await unlink(filePath);
    } catch (error) {
      console.warn('Failed to delete file from disk:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database (cascade will handle selections)
    await prisma.photo.delete({
      where: { id: photoId },
    });

    // Revalidate paths
    if (photo.workspace) {
      revalidatePath(`/workspace/${photo.workspace.slug}`);
      revalidateTag(`photos-${photo.workspaceId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error instanceof Error ? error : new Error('Failed to delete photo');
  }
}

export async function togglePhotoSelection(data: PhotoSelectionData) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    // Verify photo exists and user has access
    const photo = await prisma.photo.findUnique({
      where: { id: data.photoId },
      include: { 
        workspace: { select: { slug: true } },
        selections: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check workspace access
    if (user.role !== 'SUPER_ADMIN' && photo.workspaceId !== user.workspaceId) {
      throw new Error('Access denied to this workspace');
    }

    const existingSelection = photo.selections[0];

    if (existingSelection) {
      // Remove selection
      await prisma.photoSelection.delete({
        where: { id: existingSelection.id },
      });
    } else {
      // Add selection
      await prisma.photoSelection.create({
        data: {
          photoId: data.photoId,
          userId: session.user.id,
        },
      });
    }

    // Revalidate paths
    if (photo.workspace) {
      revalidatePath(`/workspace/${photo.workspace.slug}`);
      revalidateTag(`photos-${photo.workspaceId}`);
    }

    return { 
      success: true, 
      selected: !existingSelection 
    };
  } catch (error) {
    console.error('Error toggling photo selection:', error);
    throw error instanceof Error ? error : new Error('Failed to toggle photo selection');
  }
}

export async function getPhotos(workspaceId: string, page: number = 1, limit: number = 20) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check workspace access
    if (user.role !== 'SUPER_ADMIN' && user.workspaceId !== workspaceId) {
      throw new Error('Access denied to this workspace');
    }

    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: { workspaceId },
        include: {
          uploadedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          selections: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.photo.count({
        where: { workspaceId },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      photos,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching photos:', error);
    throw new Error('Failed to fetch photos');
  }
}