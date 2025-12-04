'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { CaseWithRelations, CaseUpdatePayload } from '@/types/case.types';
import { toast } from 'sonner';

// ========================================
// Query Keys
// ========================================

export const caseKeys = {
  all: ['cases'] as const,
  detail: (id: string) => [...caseKeys.all, id] as const,
};

// ========================================
// Fetcher
// ========================================

const fetchCase = async (caseId: string): Promise<CaseWithRelations> => {
  const response = await fetch(`/api/cases/${caseId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch case');
  }

  return response.json();
};

/**
 * Custom hook for managing case data
 *
 * Provides:
 * - Case data with React Query caching and revalidation
 * - updateCase function with optimistic UI
 * - Error handling and loading states
 * - Toast notifications
 *
 * @param caseId - The ID of the case to manage
 * @param initialData - Optional initial data from server
 */
export function useCase(caseId: string, initialData?: CaseWithRelations) {
  const queryClient = useQueryClient();

  // ========================================
  // Query
  // ========================================
  const {
    data: caseData,
    error,
    isLoading,
    isFetching: isValidating,
    refetch,
  } = useQuery({
    queryKey: caseKeys.detail(caseId),
    queryFn: () => fetchCase(caseId),
    initialData,
    enabled: !!caseId,
    staleTime: 60000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // ========================================
  // Update Mutation
  // ========================================
  const updateMutation = useMutation({
    mutationFn: async (updates: CaseUpdatePayload) => {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update case');
      }

      return response.json() as Promise<CaseWithRelations>;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: caseKeys.detail(caseId) });

      // Snapshot previous value
      const previousCase = queryClient.getQueryData<CaseWithRelations>(
        caseKeys.detail(caseId)
      );

      // Optimistically update
      if (previousCase) {
        queryClient.setQueryData<CaseWithRelations>(caseKeys.detail(caseId), {
          ...previousCase,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousCase };
    },
    onError: (error, _updates, context) => {
      // Rollback on error
      if (context?.previousCase) {
        queryClient.setQueryData(caseKeys.detail(caseId), context.previousCase);
      }
      toast.error('שגיאה בשמירה', {
        description:
          error instanceof Error ? error.message : 'אנא נסה שוב מאוחר יותר',
      });
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
    },
  });

  // ========================================
  // Update Case Function (backward compatible)
  // ========================================
  const updateCase = useCallback(
    async (updates: CaseUpdatePayload): Promise<CaseWithRelations | null> => {
      if (!caseData) {
        toast.error('שגיאה', {
          description: 'לא ניתן לעדכן - נתוני התיק לא נטענו',
        });
        return null;
      }

      try {
        return await updateMutation.mutateAsync(updates);
      } catch {
        return null;
      }
    },
    [caseData, updateMutation]
  );

  // ========================================
  // Refresh Function
  // ========================================
  const refresh = useCallback(async () => {
    try {
      await refetch();
      toast.success('הנתונים עודכנו', {
        description: 'התיק נטען מחדש בהצלחה',
      });
    } catch {
      toast.error('שגיאה בטעינה', {
        description: 'לא הצלחנו לטעון את הנתונים מחדש',
      });
    }
  }, [refetch]);

  // ========================================
  // Mutate function (backward compatible)
  // ========================================
  const mutate = useCallback(
    (data?: CaseWithRelations) => {
      if (data) {
        queryClient.setQueryData(caseKeys.detail(caseId), data);
      } else {
        queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      }
    },
    [queryClient, caseId]
  );

  // ========================================
  // Return Hook Interface
  // ========================================
  return {
    // Data
    caseData,

    // States
    isLoading,
    isValidating,
    isSaving: updateMutation.isPending,
    error,

    // Actions
    updateCase,
    refresh,
    mutate,
  };
}

/**
 * Type for the hook return value
 */
export type UseCaseReturn = ReturnType<typeof useCase>;
