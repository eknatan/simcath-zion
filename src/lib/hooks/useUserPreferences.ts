'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface WelcomeCardPreferences {
  show: boolean;
  showHebrewDate: boolean;
  showWeddingsToday: boolean;
  showPendingTransfers: boolean;
  showPendingApplicants: boolean;
  showUrgentAlerts: boolean;
}

export interface UserPreferences {
  welcomeCard: WelcomeCardPreferences;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  welcomeCard: {
    show: true,
    showHebrewDate: true,
    showWeddingsToday: true,
    showPendingTransfers: true,
    showPendingApplicants: true,
    showUrgentAlerts: true,
  },
};

export function useUserPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery<UserPreferences>({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/user/preferences');
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      return response.json();
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-preferences'] });

      // Snapshot previous value
      const previousPreferences = queryClient.getQueryData<UserPreferences>(['user-preferences']);

      // Optimistically update
      queryClient.setQueryData<UserPreferences>(['user-preferences'], (old) => {
        if (!old) return { ...DEFAULT_PREFERENCES, ...updates };
        return {
          ...old,
          ...updates,
          welcomeCard: {
            ...old.welcomeCard,
            ...(updates.welcomeCard || {}),
          },
        };
      });

      return { previousPreferences };
    },
    onError: (_err, _updates, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(['user-preferences'], context.previousPreferences);
      }
    },
    onSuccess: (data) => {
      // Update cache with server response (no refetch needed)
      queryClient.setQueryData(['user-preferences'], data);
    },
  });

  const updateWelcomeCardPreference = (key: keyof WelcomeCardPreferences, value: boolean) => {
    mutation.mutate({
      welcomeCard: {
        ...(query.data?.welcomeCard || DEFAULT_PREFERENCES.welcomeCard),
        [key]: value,
      },
    });
  };

  return {
    preferences: query.data || DEFAULT_PREFERENCES,
    isLoading: query.isLoading,
    error: query.error,
    updatePreferences: mutation.mutate,
    updateWelcomeCardPreference,
    isUpdating: mutation.isPending,
  };
}
