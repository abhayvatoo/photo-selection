import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadPhoto } from '@/lib/storage';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Google Cloud Storage
    const uploadResult = await uploadPhoto(buffer, file.name, file.type);

    // Save photo metadata to database
    const photo = await prisma.photo.create({
      data: {
        name: file.name,
        filename: uploadResult.filename,
        gcsUrl: uploadResult.publicUrl,
        mimeType: file.type,
        size: uploadResult.size,
        uploadedById: userId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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

    return NextResponse.json({ photo });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
