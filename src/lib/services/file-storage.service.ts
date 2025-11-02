/**
 * File Storage Service
 *
 * Handles file upload and management using Supabase Storage.
 * Provides abstraction layer for storage operations.
 *
 * Features:
 * - Upload files to Supabase Storage
 * - Delete files from Supabase Storage
 * - Generate public URLs
 * - File validation
 * - Error handling
 */

import { createClient } from '@/lib/supabase/server';

interface UploadOptions {
  filename: string;
  contentType: string;
  caseId: string;
  fileType: string;
}

interface UploadResult {
  url: string;
  pathname: string;
  downloadUrl: string;
}

// ========================================
// Configuration
// ========================================

/**
 * Supabase Storage bucket name for case files
 */
const STORAGE_BUCKET = 'case-files';

// ========================================
// Upload
// ========================================

/**
 * Upload a file to Supabase Storage
 *
 * @param file - The file to upload
 * @param options - Upload options (filename, contentType, etc.)
 * @returns Upload result with URLs
 *
 * @example
 * ```ts
 * const result = await uploadToStorage(file, {
 *   filename: 'menu.pdf',
 *   contentType: 'application/pdf',
 *   caseId: 'case-123',
 *   fileType: 'menu'
 * });
 * console.log(result.url); // Public URL
 * ```
 */
export async function uploadToStorage(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    // Create a unique path: cases/{caseId}/{fileType}/{timestamp}-{filename}
    const timestamp = Date.now();
    const sanitizedFilename = options.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `cases/${options.caseId}/${options.fileType}/${timestamp}-${sanitizedFilename}`;

    // Get Supabase client
    const supabase = await createClient();

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(pathname, arrayBuffer, {
        contentType: options.contentType || file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

    return {
      url: publicUrl,
      pathname: data.path,
      downloadUrl: publicUrl,
    };
  } catch (error) {
    console.error('Error uploading to storage:', error);
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ========================================
// Delete
// ========================================

/**
 * Delete a file from Supabase Storage
 *
 * @param pathname - The pathname of the file in storage (not the full URL)
 *
 * @example
 * ```ts
 * await deleteFromStorage('cases/abc123/menu/1234567890-menu.pdf');
 * ```
 */
export async function deleteFromStorage(pathname: string): Promise<void> {
  try {
    // Get Supabase client
    const supabase = await createClient();

    // Extract pathname from URL if a full URL was provided
    let pathToDelete = pathname;
    if (pathname.startsWith('http')) {
      // Extract path from URL
      // Example: https://xxx.supabase.co/storage/v1/object/public/case-files/cases/...
      const urlParts = pathname.split('/case-files/');
      if (urlParts.length > 1) {
        pathToDelete = urlParts[1];
      }
    }

    // Delete from Supabase Storage
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([pathToDelete]);

    if (error && !error.message.includes('not found')) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting from storage:', error);
    throw new Error(
      `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ========================================
// Get Public URL
// ========================================

/**
 * Get a public URL for a file
 *
 * @param pathname - The pathname of the file in storage
 * @returns Public URL
 *
 * Note: This is an async function because it needs to create a Supabase client
 */
export async function getPublicUrl(pathname: string): Promise<string> {
  const supabase = await createClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(pathname);

  return publicUrl;
}

// ========================================
// Validation
// ========================================

/**
 * Validate file before upload
 *
 * @param file - The file to validate
 * @param maxSize - Maximum file size in bytes (default: 5MB)
 * @param allowedTypes - Allowed MIME types
 * @returns Validation result
 */
export function validateFile(
  file: File,
  maxSize: number = 5 * 1024 * 1024,
  allowedTypes: string[] = ['application/pdf', 'image/jpeg', 'image/png']
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File is too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

// ========================================
// Utilities
// ========================================

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
