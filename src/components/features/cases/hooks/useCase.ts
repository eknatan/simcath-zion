'use client';

import useSWR from 'swr';
import { CaseWithRelations, CaseUpdatePayload } from '@/types/case.types';
import { toast } from 'sonner';

/**
 * Fetcher function for SWR
 * Fetches case data from API
 */
const fetcher = async (url: string): Promise<CaseWithRelations> => {
  const response = await fetch(url);

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
 * - Case data with SWR caching and revalidation
 * - updateCase function with optimistic UI
 * - Error handling and loading states
 * - Toast notifications
 *
 * @param caseId - The ID of the case to manage
 * @param initialData - Optional initial data from server
 */
export function useCase(caseId: string, initialData?: CaseWithRelations) {
  // ========================================
  // SWR Hook
  // ========================================
  const {
    data: caseData,
    error,
    isLoading,
    isValidating,
    mutate: mutateSWR,
  } = useSWR<CaseWithRelations>(
    caseId ? `/api/cases/${caseId}` : null,
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Prevent duplicate requests within 5s
    }
  );

  // ========================================
  // Update Case Function
  // ========================================

  /**
   * Updates case data with optimistic UI
   *
   * Steps:
   * 1. Optimistically update local state
   * 2. Send API request
   * 3. Revalidate from server
   * 4. Show toast notification
   * 5. Rollback on error
   *
   * @param updates - Partial case data to update
   * @returns Promise that resolves when update is complete
   */
  const updateCase = async (
    updates: CaseUpdatePayload
  ): Promise<CaseWithRelations | null> => {
    if (!caseData) {
      toast.error('שגיאה', {
        description: 'לא ניתן לעדכן - נתוני התיק לא נטענו',
      });
      return null;
    }

    // Store original data for rollback
    const originalData = caseData;

    try {
      // ========================================
      // Step 1: Optimistic Update
      // ========================================
      const optimisticData: CaseWithRelations = {
        ...caseData,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Update local state immediately (don't revalidate yet)
      mutateSWR(optimisticData, false);

      // ========================================
      // Step 2: API Request
      // ========================================
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update case');
      }

      const updatedCase: CaseWithRelations = await response.json();

      // ========================================
      // Step 3: Revalidate from server
      // ========================================
      await mutateSWR(updatedCase, false);

      // ========================================
      // Step 4: Success notification
      // ========================================
      // Note: For auto-save, we might want to show a more subtle indicator
      // instead of a toast. This can be customized in the component.

      return updatedCase;
    } catch (error) {
      // ========================================
      // Step 5: Rollback on error
      // ========================================
      console.error('Failed to update case:', error);

      // Rollback to original data
      mutateSWR(originalData, false);

      // Show error toast
      toast.error('שגיאה בשמירה', {
        description:
          error instanceof Error ? error.message : 'אנא נסה שוב מאוחר יותר',
        action: {
          label: 'נסה שוב',
          onClick: () => updateCase(updates),
        },
      });

      return null;
    }
  };

  // ========================================
  // Refresh Function
  // ========================================

  /**
   * Force refresh case data from server
   */
  const refresh = async () => {
    try {
      await mutateSWR();
      toast.success('הנתונים עודכנו', {
        description: 'התיק נטען מחדש בהצלחה',
      });
    } catch {
      toast.error('שגיאה בטעינה', {
        description: 'לא הצלחנו לטעון את הנתונים מחדש',
      });
    }
  };

  // ========================================
  // Return Hook Interface
  // ========================================
  return {
    // Data
    caseData,

    // States
    isLoading,
    isValidating,
    isSaving: false, // This will be managed by the component using debounce
    error,

    // Actions
    updateCase,
    refresh,
    mutate: mutateSWR,
  };
}

/**
 * Type for the hook return value
 */
export type UseCaseReturn = ReturnType<typeof useCase>;
