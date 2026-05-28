import path from 'path';
import fs from 'fs/promises';
import { mkdir } from 'fs/promises';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';

export async function ensureUploadDir(subDir: string = '') {
  const dirPath = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR;
  try {
    await mkdir(dirPath, { recursive: true });
    return dirPath;
  } catch (error) {
    console.error('[v0] Error creating upload directory:', error);
    throw error;
  }
}

export async function saveFile(
  file: Buffer,
  filename: string,
  subDir: string = ''
): Promise<string> {
  try {
    const dirPath = await ensureUploadDir(subDir);
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${filename}`;
    const fullPath = path.join(dirPath, uniqueFilename);

    await fs.writeFile(fullPath, file);

    // Return the public URL path
    const relativePath = subDir
      ? `/uploads/${subDir}/${uniqueFilename}`
      : `/uploads/${uniqueFilename}`;

    return relativePath;
  } catch (error) {
    console.error('[v0] Error saving file:', error);
    throw error;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join('.', 'public', filePath);
    await fs.unlink(fullPath);
  } catch (error) {
    console.error('[v0] Error deleting file:', error);
    // Don't throw - file might not exist
  }
}

export async function getFileBuffer(filePath: string): Promise<Buffer> {
  try {
    const fullPath = path.join('.', 'public', filePath);
    return await fs.readFile(fullPath);
  } catch (error) {
    console.error('[v0] Error reading file:', error);
    throw error;
  }
}
