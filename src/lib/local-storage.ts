import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface LocalUploadResult {
  filename: string;
  publicUrl: string;
  size: number;
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function uploadPhotoLocally(
  file: Buffer,
  originalName: string,
  mimeType: string
): Promise<LocalUploadResult> {
  await ensureUploadDir();
  
  const fileExtension = path.extname(originalName);
  const filename = `${uuidv4()}${fileExtension}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  
  // Write file to local storage
  await writeFile(filePath, file);
  
  // Create public URL (served by Next.js static files)
  const publicUrl = `/uploads/${filename}`;
  
  return {
    filename,
    publicUrl,
    size: file.length,
  };
}

export async function deletePhotoLocally(filename: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    const { unlink } = await import('fs/promises');
    await unlink(filePath);
  } catch (error: any) {
    console.warn(`Failed to delete local file ${filename}:`, error.message);
  }
}

export function getLocalPhotoUrl(filename: string): string {
  return `/uploads/${filename}`;
}
