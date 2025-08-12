import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import archiver from 'archiver';
import { Readable } from 'stream';

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

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Set up response headers for ZIP download
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `selected-photos-${timestamp}.zip`;
    
    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // Create a readable stream for the response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Handle archive events
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      writer.close();
    });

    archive.on('end', () => {
      writer.close();
    });

    // Pipe archive data to the writable stream
    archive.on('data', (chunk) => {
      writer.write(chunk);
    });

    // Add photos to archive
    for (const photo of photos) {
      try {
        // Fetch the photo file
        const photoResponse = await fetch(photo.url);
        if (photoResponse.ok) {
          const photoBuffer = await photoResponse.arrayBuffer();
          const photoStream = Readable.from(Buffer.from(photoBuffer));
          
          // Add to archive with original filename
          archive.append(photoStream, { 
            name: photo.originalName || photo.filename 
          });
        }
      } catch (error) {
        console.error(`Error adding photo ${photo.id} to archive:`, error);
        // Continue with other photos even if one fails
      }
    }

    // Finalize the archive
    archive.finalize();

    return new NextResponse(readable, { headers });

  } catch (error) {
    console.error('Error creating photo download:', error);
    return NextResponse.json(
      { error: 'Failed to create download' },
      { status: 500 }
    );
  }
}
