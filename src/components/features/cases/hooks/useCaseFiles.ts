'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CaseFile, WeddingFileType, MAX_FILE_SIZE } from '@/types/case.types';
import { toast } from 'sonner';
import { caseKeys } from './useCase';

// ========================================
// Query Keys
// ========================================

export const caseFilesKeys = {
  all: ['caseFiles'] as const,
  list: (caseId: string) => [...caseFilesKeys.all, caseId] as const,
};

interface UseCaseFilesReturn {
  files: CaseFile[] | undefined;
  isLoading: boolean;
  error: Error | null;
  uploadFile: (file: File, fileType: WeddingFileType) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  uploadProgress: Map<string, number>;
  isUploading: boolean;
  refresh: () => Promise<void>;
}

// ========================================
// Fetcher
// ========================================

const fetchCaseFiles = async (caseId: string): Promise<CaseFile[]> => {
  const response = await fetch(`/api/cases/${caseId}/files`);
  if (!response.ok) {
    throw new Error('Failed to fetch files');
  }
  return response.json();
};

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
  const queryClient = useQueryClient();

  // ========================================
  // State
  // ========================================

  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(
    new Map()
  );

  // ========================================
  // Query
  // ========================================

  const {
    data: files,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: caseFilesKeys.list(caseId),
    queryFn: () => fetchCaseFiles(caseId),
    enabled: !!caseId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // ========================================
  // Upload Mutation
  // ========================================

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      fileType,
      uploadId,
    }: {
      file: File;
      fileType: WeddingFileType;
      uploadId: string;
    }) => {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_type', fileType);
      formData.append('case_id', caseId);

      // Simulate progress
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

      try {
        const response = await fetch(`/api/cases/${caseId}/files`, {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'העלאה נכשלה');
        }

        return response.json() as Promise<CaseFile>;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onMutate: async ({ uploadId }) => {
      setUploadProgress((prev) => new Map(prev).set(uploadId, 0));
    },
    onSuccess: (uploadedFile, { uploadId }) => {
      // Complete progress
      setUploadProgress((prev) => new Map(prev).set(uploadId, 100));

      // Optimistic update
      queryClient.setQueryData<CaseFile[]>(
        caseFilesKeys.list(caseId),
        (old) => (old ? [...old, uploadedFile] : [uploadedFile])
      );

      // Invalidate case data to update file counts
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) });

      toast.success('הקובץ הועלה בהצלחה');

      // Remove from progress after delay
      setTimeout(() => {
        setUploadProgress((prev) => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
      }, 1000);
    },
    onError: (error, { uploadId }) => {
      const message = error instanceof Error ? error.message : 'העלאה נכשלה';
      toast.error(message);
      console.error('Upload error:', error);

      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(uploadId);
        return newMap;
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: caseFilesKeys.list(caseId) });
    },
  });

  // ========================================
  // Delete Mutation
  // ========================================

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('מחיקה נכשלה');
      }
    },
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({
        queryKey: caseFilesKeys.list(caseId),
      });

      const previousFiles = queryClient.getQueryData<CaseFile[]>(
        caseFilesKeys.list(caseId)
      );

      queryClient.setQueryData<CaseFile[]>(
        caseFilesKeys.list(caseId),
        (old) => old?.filter((f) => f.id !== fileId) || []
      );

      return { previousFiles };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success('הקובץ נמחק בהצלחה');
    },
    onError: (error, _fileId, context) => {
      if (context?.previousFiles) {
        queryClient.setQueryData(
          caseFilesKeys.list(caseId),
          context.previousFiles
        );
      }
      const message = error instanceof Error ? error.message : 'מחיקה נכשלה';
      toast.error(message);
      console.error('Delete error:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: caseFilesKeys.list(caseId) });
    },
  });

  // ========================================
  // Upload File
  // ========================================

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
      await uploadMutation.mutateAsync({ file, fileType, uploadId });
    },
    [uploadMutation]
  );

  // ========================================
  // Delete File
  // ========================================

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      await deleteMutation.mutateAsync(fileId);
    },
    [deleteMutation]
  );

  // ========================================
  // Refresh
  // ========================================

  const refresh = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  // ========================================
  // Return
  // ========================================

  return {
    files,
    isLoading,
    error: error || null,
    uploadFile,
    deleteFile,
    uploadProgress,
    isUploading: uploadProgress.size > 0,
    refresh,
  };
}
