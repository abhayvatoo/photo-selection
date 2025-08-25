import {
  uploadPhoto as uploadToGCS,
  deletePhoto as deleteFromGCS,
  UploadResult,
} from './gcs';
import {
  uploadPhotoLocally,
  deletePhotoLocally,
  LocalUploadResult,
} from './local-storage';

export interface StorageResult {
  filename: string;
  publicUrl: string;
  size: number;
  storageType: 'gcs' | 'local';
}

// Check if GCS is configured
function isGCSConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLOUD_PROJECT_ID &&
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET &&
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

export async function uploadPhoto(
  file: Buffer,
  originalName: string,
  mimeType: string
): Promise<StorageResult> {
  if (isGCSConfigured()) {
    try {
      const result = await uploadToGCS(file, originalName, mimeType);
      return {
        ...result,
        storageType: 'gcs',
      };
    } catch (error: any) {
      console.warn(
        '⚠️ GCS upload failed, falling back to local storage:',
        error.message
      );
      // Fall back to local storage
    }
  }

  const result = await uploadPhotoLocally(file, originalName, mimeType);
  return {
    ...result,
    storageType: 'local',
  };
}

export async function deletePhoto(
  filename: string,
  storageType: 'gcs' | 'local'
): Promise<void> {
  if (storageType === 'gcs' && isGCSConfigured()) {
    try {
      await deleteFromGCS(filename);
    } catch (error: any) {
      console.warn('⚠️ GCS delete failed:', error.message);
    }
  } else {
    await deletePhotoLocally(filename);
  }
}

export function getStorageInfo(): {
  type: 'gcs' | 'local';
  configured: boolean;
  details: string;
} {
  if (isGCSConfigured()) {
    return {
      type: 'gcs',
      configured: true,
      details: `Using GCS bucket: ${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}`,
    };
  }

  return {
    type: 'local',
    configured: true,
    details: 'Using local file storage in ./uploads directory',
  };
}
