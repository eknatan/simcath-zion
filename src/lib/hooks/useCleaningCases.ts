'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CleaningCaseWithPayment } from '@/components/features/cases/columns';

// ========================================
// Types
// ========================================

interface UseCleaningCasesOptions {
  status?: 'active' | 'inactive';
  initialData?: CleaningCaseWithPayment[];
}

// ========================================
// Query Keys
// ========================================

export const cleaningCasesKeys = {
  all: ['cleaning-cases'] as const,
  list: (status: 'active' | 'inactive') => [...cleaningCasesKeys.all, status] as const,
};

// ========================================
// Hook
// ========================================

/**
 * useCleaningCases - Hook for fetching cleaning (sick children) cases
 *
 * Features:
 * - Caching with React Query
 * - Supports initial data from SSR
 * - Stale-while-revalidate pattern
 */
export function useCleaningCases({
  status = 'active',
  initialData,
}: UseCleaningCasesOptions = {}) {
  return useQuery<CleaningCaseWithPayment[]>({
    queryKey: cleaningCasesKeys.list(status),
    queryFn: async () => {
      const response = await fetch(`/api/cleaning-cases?status=${status}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cleaning cases');
      }
      return response.json();
    },
    // Only use initialData for active status (SSR data is active-only)
    initialData: status === 'active' ? initialData : undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes - won't refetch if data is "fresh"
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
  });
}

/**
 * useInvalidateCleaningCases - Hook to invalidate cleaning cases cache
 *
 * Use after mutations (add payment, etc.)
 */
export function useInvalidateCleaningCases() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: cleaningCasesKeys.all }),
    invalidateActive: () =>
      queryClient.invalidateQueries({ queryKey: cleaningCasesKeys.list('active') }),
    invalidateInactive: () =>
      queryClient.invalidateQueries({ queryKey: cleaningCasesKeys.list('inactive') }),
  };
}
