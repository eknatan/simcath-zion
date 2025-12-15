/**
 * Hook for managing translation settings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ========================================
// Types
// ========================================

export type TranslationProvider = 'google' | 'microsoft' | 'groq';

export interface TranslationSettings {
  provider: TranslationProvider;
  google_api_key: string;
  microsoft_translator_key: string;
  microsoft_translator_region: string;
  groq_api_key: string;
  hasGoogleKey: boolean;
  hasMicrosoftKey: boolean;
  hasGroqKey: boolean;
}

export interface UpdateTranslationSettingsInput {
  provider?: TranslationProvider;
  google_api_key?: string;
  microsoft_translator_key?: string;
  microsoft_translator_region?: string;
  groq_api_key?: string;
}

export interface TestProviderResult {
  success: boolean;
  message: string;
  provider: TranslationProvider;
}

// ========================================
// API Functions
// ========================================

async function fetchTranslationSettings(): Promise<TranslationSettings> {
  const response = await fetch('/api/settings/translation');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch translation settings');
  }

  const data = await response.json();
  return data.settings;
}

async function updateTranslationSettings(settings: UpdateTranslationSettingsInput): Promise<void> {
  const response = await fetch('/api/settings/translation', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update translation settings');
  }
}

async function testTranslationProvider(provider: TranslationProvider): Promise<TestProviderResult> {
  const response = await fetch('/api/settings/translation/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ provider }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to test provider');
  }

  return data;
}

// ========================================
// Hook
// ========================================

export function useTranslationSettings() {
  const queryClient = useQueryClient();

  // Query for fetching settings
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery<TranslationSettings>({
    queryKey: ['translationSettings'],
    queryFn: fetchTranslationSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Mutation for updating settings
  const updateMutation = useMutation({
    mutationFn: updateTranslationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translationSettings'] });
      toast.success('הגדרות התרגום נשמרו בהצלחה');
    },
    onError: (error: Error) => {
      toast.error(`שגיאה בשמירת הגדרות: ${error.message}`);
    },
  });

  // Mutation for testing provider
  const testMutation = useMutation({
    mutationFn: testTranslationProvider,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.provider} עובד בהצלחה!`);
      } else {
        toast.error(`${result.provider}: ${result.message}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`שגיאה בבדיקה: ${error.message}`);
    },
  });

  return {
    // Data
    settings,
    isLoading,
    error,

    // Actions
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    testProvider: testMutation.mutate,
    isTesting: testMutation.isPending,
    testingProvider: testMutation.variables,

    refetch,
  };
}

// ========================================
// Provider Info
// ========================================

export const PROVIDER_INFO: Record<TranslationProvider, {
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  freeLimit: string;
}> = {
  google: {
    name: 'Google Gemini',
    nameHe: 'Google Gemini',
    description: 'AI-powered translation using Gemini 2.0',
    descriptionHe: 'תרגום מבוסס AI עם Gemini 2.0',
    freeLimit: 'Limited free tier',
  },
  microsoft: {
    name: 'Microsoft Translator',
    nameHe: 'Microsoft Translator',
    description: 'Professional translation service',
    descriptionHe: 'שירות תרגום מקצועי',
    freeLimit: '2M characters/month free',
  },
  groq: {
    name: 'Groq (Llama 3.3)',
    nameHe: 'Groq (Llama 3.3)',
    description: 'Fast AI translation using Llama 3.3 70B',
    descriptionHe: 'תרגום AI מהיר עם Llama 3.3 70B',
    freeLimit: 'Free & Fast',
  },
};
