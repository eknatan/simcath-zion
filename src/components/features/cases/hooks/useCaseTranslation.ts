import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { Translation, TranslatedContent } from '@/types/case.types';

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

const fetcher = async (url: string): Promise<Translation[]> => {
  const response = await fetch(url);

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

const translateCase = async (caseId: string): Promise<TranslationResponse> => {
  const response = await fetch(`/api/cases/${caseId}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Translation failed: ${response.statusText}`);
  }

  return response.json();
};

const updateTranslationApi = async (caseId: string, content: TranslatedContent): Promise<UpdateTranslationResponse> => {
  const response = await fetch(`/api/cases/${caseId}/translate`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Update failed: ${response.statusText}`);
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
 *
 * @example
 * ```tsx
 * const {
 *   translation,
 *   isTranslating,
 *   isSaving,
 *   error,
 *   translate,
 *   updateTranslation,
 *   retranslate
 * } = useCaseTranslation({ caseId: 'case-123' });
 * ```
 */
export function useCaseTranslation({ caseId }: UseCaseTranslationOptions) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch translations for this case
  const { data: translations = [], isLoading } = useSWR<Translation[]>(
    `/api/cases/${caseId}/translations`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Get the English translation (should be only one per case for now)
  const translation = Array.isArray(translations)
    ? translations.find(t => t.lang_from === 'he' && t.lang_to === 'en')
    : undefined;

  // ========================================
  // Translate Function
  // ========================================

  /**
   * Translate the case from Hebrew to English using AI
   */
  const translate = useCallback(async (): Promise<boolean> => {
    if (!caseId) {
      const errorMessage = 'Case ID is required';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }

    setIsTranslating(true);
    setError(null);

    try {
      // Show optimistic loading toast
      const toastId = toast.loading('מתרגם תיק לאנגלית...');

      const result = await translateCase(caseId);

      if (result.success && result.data) {
        // Optimistic update - add the new translation to the cache
        mutate(() => [
          ...(Array.isArray(translations) ? translations : []),
          {
            id: `temp-${Date.now()}`, // Will be replaced by real ID from server
            case_id: caseId,
            lang_from: 'he',
            lang_to: 'en',
            content_json: result.data,
            edited_by_user: false,
            translated_by: '', // Will be filled by server
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Translation,
        ], false);

        toast.success('התיק תורגם בהצלחה לאנגלית', { id: toastId });
        return true;
      } else {
        const errorMessage = result.error || 'Translation failed';
        setError(errorMessage);
        toast.error(errorMessage, { id: toastId });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      toast.error(`תרגום אוטומטי נכשל: ${errorMessage}. אתה יכול להמשיך ולתרגם ידנית.`);
      return false;
    } finally {
      setIsTranslating(false);
    }
  }, [caseId]);

  // ========================================
  // Update Translation Function
  // ========================================

  /**
   * Update translation with manual edits
   */
  const updateTranslation = useCallback(async (content: TranslatedContent): Promise<boolean> => {
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

    setIsSaving(true);
    setError(null);

    try {
      const result = await updateTranslationApi(caseId, content);

      if (result.success && result.data) {
        // Optimistic update - update the translation in cache
        mutate(`/api/cases/${caseId}/translations`, (current: Translation[] = []) =>
          current.map(t =>
            t.id === translation.id
              ? { ...t, ...result.data, edited_by_user: true, updated_at: new Date().toISOString() }
              : t
          )
        , false);

        toast.success('התרגום עודכן בהצלחה');
        return true;
      } else {
        const errorMessage = result.error || 'Update failed';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
      toast.error(`שמירת התרגום נכשלה: ${errorMessage}. נסה שוב מאוחר יותר.`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [caseId, translation]);

  // ========================================
  // Retranslate Function
  // ========================================

  /**
   * Retranslate the case (replaces existing translation)
   */
  const retranslate = useCallback(async (): Promise<boolean> => {
    if (!caseId) {
      const errorMessage = 'Case ID is required';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const toastId = toast.loading('מתרגם מחדש תיק לאנגלית...');

      const result = await translateCase(caseId);

      if (result.success && result.data) {
        // Optimistic update - replace the translation in cache
        mutate(() =>
          (Array.isArray(translations) ? translations : []).map(t =>
            (t.lang_from === 'he' && t.lang_to === 'en')
              ? {
                  ...t,
                  content_json: result.data,
                  edited_by_user: false, // Reset edited flag
                  updated_at: new Date().toISOString(),
                } as Translation
              : t
          )
        , false);

        toast.success('התיק תורגם מחדש בהצלחה', { id: toastId });
        return true;
      } else {
        const errorMessage = result.error || 'Retranslation failed';
        setError(errorMessage);
        toast.error(errorMessage, { id: toastId });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retranslation failed';
      setError(errorMessage);
      toast.error(`תרגום מחדש נכשל: ${errorMessage}. אתה יכול להמשיך לערוך ידנית.`);
      return false;
    } finally {
      setIsTranslating(false);
    }
  }, [caseId]);

  // ========================================
  // Utility Functions
  // ========================================

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Revalidate translations from server
   */
  const refresh = useCallback(() => {
    mutate(`/api/cases/${caseId}/translations`);
  }, [caseId]);

  // ========================================
  // Return Value
  // ========================================

  return {
    // Data
    translation,
    translations,

    // Loading states
    isLoading,
    isTranslating,
    isSaving,

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