import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { CaseFile, WeddingFileType, MAX_FILE_SIZE } from '@/types/case.types';
import { toast } from 'sonner';

interface UseCaseFilesReturn {
  files: CaseFile[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
  uploadFile: (file: File, fileType: WeddingFileType) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  uploadProgress: Map<string, number>;
  isUploading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing case files
 *
 * Features:
 * - File upload with progress tracking
 * - File deletion
 * - Automatic cache invalidation
 * - Optimistic updates
 * - Error handling with toast notifications
 *
 * @param caseId - The case ID
 * @returns File management utilities
 */
export function useCaseFiles(caseId: string): UseCaseFilesReturn {
  // ========================================
  // State
  // ========================================

  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());

  // ========================================
  // Data Fetching with SWR
  // ========================================

  const {
    data: files,
    error,
    isLoading,
  } = useSWR<CaseFile[]>(
    caseId ? `/api/cases/${caseId}/files` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  // ========================================
  // Upload File
  // ========================================

  /**
   * Upload a file to the case
   */
  const uploadFile = useCallback(
    async (file: File, fileType: WeddingFileType): Promise<void> => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
        toast.error(`הקובץ גדול מדי. גודל מקסימלי: ${maxSizeMB}MB`);
        return;
      }

      // Validate file type
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error('סוג קובץ לא נתמך. אנא העלה PDF, JPG או PNG');
        return;
      }

      const uploadId = `${fileType}-${Date.now()}`;

      try {
        // Initialize progress
        setUploadProgress((prev) => new Map(prev).set(uploadId, 0));

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_type', fileType);
        formData.append('case_id', caseId);

        // Simulate progress (in real implementation, use XMLHttpRequest or fetch with progress)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(uploadId) || 0;
            if (current < 90) {
              newMap.set(uploadId, Math.min(current + 10, 90));
            }
            return newMap;
          });
        }, 200);

        // Upload
        const response = await fetch(`/api/cases/${caseId}/files`, {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'העלאה נכשלה');
        }

        const uploadedFile: CaseFile = await response.json();

        // Complete progress
        setUploadProgress((prev) => new Map(prev).set(uploadId, 100));

        // Optimistic update - add file to cache immediately
        mutate(
          `/api/cases/${caseId}/files`,
          (currentFiles: CaseFile[] | undefined) => {
            return currentFiles ? [...currentFiles, uploadedFile] : [uploadedFile];
          },
          false // Don't revalidate immediately
        );

        // Also invalidate the case data to update file counts
        mutate(`/api/cases/${caseId}`);

        toast.success('הקובץ הועלה בהצלחה');

        // Remove from progress after delay
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newMap = new Map(prev);
            newMap.delete(uploadId);
            return newMap;
          });
        }, 1000);

        // Revalidate after success
        await mutate(`/api/cases/${caseId}/files`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'העלאה נכשלה';
        toast.error(message);
        console.error('Upload error:', error);

        // Remove from progress
        setUploadProgress((prev) => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });

        throw error;
      }
    },
    [caseId]
  );

  // ========================================
  // Delete File
  // ========================================

  /**
   * Delete a file from the case
   */
  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      try {
        // Optimistic update - remove file from cache immediately
        mutate(
          `/api/cases/${caseId}/files`,
          (currentFiles: CaseFile[] | undefined) => {
            return currentFiles?.filter((f) => f.id !== fileId) || [];
          },
          false // Don't revalidate immediately
        );

        // Delete from server
        const response = await fetch(`/api/files/${fileId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('מחיקה נכשלה');
        }

        // Also invalidate the case data to update file counts
        mutate(`/api/cases/${caseId}`);

        toast.success('הקובץ נמחק בהצלחה');

        // Revalidate after success
        await mutate(`/api/cases/${caseId}/files`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'מחיקה נכשלה';
        toast.error(message);
        console.error('Delete error:', error);

        // Revert optimistic update on error
        await mutate(`/api/cases/${caseId}/files`);

        throw error;
      }
    },
    [caseId]
  );

  // ========================================
  // Refresh
  // ========================================

  /**
   * Manually refresh files
   */
  const refresh = useCallback(async (): Promise<void> => {
    await mutate(`/api/cases/${caseId}/files`);
  }, [caseId]);

  // ========================================
  // Return
  // ========================================

  return {
    files,
    isLoading,
    error,
    uploadFile,
    deleteFile,
    uploadProgress,
    isUploading: uploadProgress.size > 0,
    refresh,
  };
}
