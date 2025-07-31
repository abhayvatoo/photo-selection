import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

// Initialize storage only if environment variables are provided
let storage: Storage | null = null;
let bucket: any = null;

if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_STORAGE_BUCKET) {
  try {
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);
  } catch (error: any) {
    console.warn('Google Cloud Storage not configured, using fallback:', error.message);
  }
}

export interface UploadResult {
  filename: string;
  publicUrl: string;
  size: number;
}

export async function uploadPhoto(
  file: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  if (!bucket) {
    throw new Error('Google Cloud Storage not configured');
  }
  
  const filename = `photos/${uuidv4()}-${originalName}`;
  const fileUpload = bucket.file(filename);

  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: mimeType,
    },
    public: true,
    validation: 'md5',
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (error: any) => {
      reject(error);
    });

    stream.on('finish', async () => {
      try {
        // Make the file public
        await fileUpload.makePublic();
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        
        resolve({
          filename,
          publicUrl,
          size: file.length,
        });
      } catch (error) {
        reject(error);
      }
    });

    stream.end(file);
  });
}

export async function deletePhoto(filename: string): Promise<void> {
  if (!bucket) {
    throw new Error('Google Cloud Storage not configured');
  }
  const file = bucket.file(filename);
  await file.delete();
}

export async function getSignedUrl(filename: string): Promise<string> {
  if (!bucket) {
    throw new Error('Google Cloud Storage not configured');
  }
  const file = bucket.file(filename);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  return url;
}
