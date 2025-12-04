'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Translation, TranslatedContent } from '@/types/case.types';

// ========================================
// Query Keys
// ========================================

export const translationKeys = {
  all: ['translations'] as const,
  list: (caseId: string) => [...translationKeys.all, caseId] as const,
};

// ========================================
// Types
// ========================================

interface UseCaseTranslationOptions {
  caseId: string;
}

interface TranslationResponse {
  success: boolean;
  data?: TranslatedContent;
  error?: string;
}

interface UpdateTranslationResponse {
  success: boolean;
  data?: Translation;
  error?: string;
}

// ========================================
// API Functions
// ========================================

const fetchTranslations = async (caseId: string): Promise<Translation[]> => {
  const response = await fetch(`/api/cases/${caseId}/translations`);

  if (!response.ok) {
    throw new Error(`Failed to fetch translations: ${response.statusText}`);
  }

  const data = await response.json();

  // Handle both response formats: { translations: [...] } or direct array [...]
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.translations)) {
    return data.translations;
  }

  return [];
};

const translateCaseApi = async (
  caseId: string
): Promise<TranslationResponse> => {
  const response = await fetch(`/api/cases/${caseId}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Translation failed: ${response.statusText}`
    );
  }

  return response.json();
};

const updateTranslationApi = async (
  caseId: string,
  content: TranslatedContent
): Promise<UpdateTranslationResponse> => {
  const response = await fetch(`/api/cases/${caseId}/translate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Update failed: ${response.statusText}`
    );
  }

  return response.json();
};

// ========================================
// useCaseTranslation Hook
// ========================================

/**
 * useCaseTranslation - Manages English translation for a case
 *
 * Features:
 * - Fetch existing translations
 * - Translate case using AI
 * - Update translation with manual edits
 * - Optimistic updates
 * - Error handling with toast notifications
 * - Loading states
 *
 * @param options - Hook options containing caseId
 */
export function useCaseTranslation({ caseId }: UseCaseTranslationOptions) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Query
  const { data: translations = [], isLoading } = useQuery({
    queryKey: translationKeys.list(caseId),
    queryFn: () => fetchTranslations(caseId),
    enabled: !!caseId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Get the English translation (should be only one per case for now)
  const translation = Array.isArray(translations)
    ? translations.find((t) => t.lang_from === 'he' && t.lang_to === 'en')
    : undefined;

  // ========================================
  // Mutations
  // ========================================

  const translateMutation = useMutation({
    mutationFn: () => translateCaseApi(caseId),
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Optimistic update
        queryClient.setQueryData<Translation[]>(
          translationKeys.list(caseId),
          (old = []) => [
            ...old.filter(
              (t) => !(t.lang_from === 'he' && t.lang_to === 'en')
            ),
            {
              id: `temp-${Date.now()}`,
              case_id: caseId,
              lang_from: 'he',
              lang_to: 'en',
              content_json: result.data,
              edited_by_user: false,
              translated_by: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Translation,
          ]
        );
        toast.success('התיק תורגם בהצלחה לאנגלית');
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(
        `תרגום אוטומטי נכשל: ${err.message}. אתה יכול להמשיך ולתרגם ידנית.`
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.list(caseId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (content: TranslatedContent) =>
      updateTranslationApi(caseId, content),
    onSuccess: (result) => {
      if (result.success && result.data) {
        queryClient.setQueryData<Translation[]>(
          translationKeys.list(caseId),
          (old = []) =>
            old.map((t) =>
              t.id === translation?.id
                ? {
                    ...t,
                    ...result.data,
                    edited_by_user: true,
                    updated_at: new Date().toISOString(),
                  }
                : t
            )
        );
        toast.success('התרגום עודכן בהצלחה');
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(`שמירת התרגום נכשלה: ${err.message}. נסה שוב מאוחר יותר.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.list(caseId) });
    },
  });

  // ========================================
  // Actions
  // ========================================

  const translate = useCallback(async (): Promise<boolean> => {
    if (!caseId) {
      const errorMessage = 'Case ID is required';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }

    setError(null);
    const toastId = toast.loading('מתרגם תיק לאנגלית...');

    try {
      const result = await translateMutation.mutateAsync();
      toast.dismiss(toastId);
      return result.success && !!result.data;
    } catch {
      toast.dismiss(toastId);
      return false;
    }
  }, [caseId, translateMutation]);

  const updateTranslation = useCallback(
    async (content: TranslatedContent): Promise<boolean> => {
      if (!caseId) {
        const errorMessage = 'Case ID is required';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }

      if (!translation) {
        const errorMessage = 'No translation found to update';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }

      setError(null);

      try {
        const result = await updateMutation.mutateAsync(content);
        return result.success && !!result.data;
      } catch {
        return false;
      }
    },
    [caseId, translation, updateMutation]
  );

  const retranslate = useCallback(async (): Promise<boolean> => {
    if (!caseId) {
      const errorMessage = 'Case ID is required';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }

    setError(null);
    const toastId = toast.loading('מתרגם מחדש תיק לאנגלית...');

    try {
      const result = await translateMutation.mutateAsync();
      toast.dismiss(toastId);
      if (result.success) {
        toast.success('התיק תורגם מחדש בהצלחה');
      }
      return result.success && !!result.data;
    } catch {
      toast.dismiss(toastId);
      return false;
    }
  }, [caseId, translateMutation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: translationKeys.list(caseId) });
  }, [queryClient, caseId]);

  // ========================================
  // Return Value
  // ========================================

  return {
    // Data
    translation,
    translations,

    // Loading states
    isLoading,
    isTranslating: translateMutation.isPending,
    isSaving: updateMutation.isPending,

    // Error state
    error,

    // Actions
    translate,
    updateTranslation,
    retranslate,
    clearError,
    refresh,

    // Computed states
    hasTranslation: !!translation,
    isEditedByUser: translation?.edited_by_user || false,
  };
}

// ========================================
// Hook Types
// ========================================

export type UseCaseTranslationReturn = ReturnType<typeof useCaseTranslation>;
