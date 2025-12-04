/**
 * Custom Hook: useApplicants
 *
 * ניהול בקשות (applicants) עם React Query
 *
 * עקרונות SOLID:
 * - Single Responsibility: מטפל רק בניהול נתוני בקשות
 * - Open/Closed: ניתן להרחבה ללוגיקות נוספות
 * - Dependency Inversion: תלוי ב-API abstraction
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Applicant, ApplicantStatus, CaseType } from '@/types/case.types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ========================================
// Types
// ========================================

interface ApplicantsFilters {
  case_type?: CaseType;
  status?: ApplicantStatus;
  search?: string;
  city?: string;
  sort_by?: 'created_at' | 'wedding_date_gregorian';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ApplicantsResponse {
  success: boolean;
  data: Applicant[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ApproveResponse {
  success: boolean;
  message: string;
  case: {
    id: string;
    case_number: number;
    case_number_formatted: string;
    status: string;
    case_type: string;
  };
}

interface RejectResponse {
  success: boolean;
  message: string;
}

interface RestoreResponse {
  success: boolean;
  message: string;
}

// ========================================
// Query Keys
// ========================================

const applicantsKeys = {
  all: ['applicants'] as const,
  list: (filters: ApplicantsFilters) => [...applicantsKeys.all, filters] as const,
};

// ========================================
// Fetcher Functions
// ========================================

const buildQueryString = (filters: ApplicantsFilters): string => {
  const params = new URLSearchParams();

  if (filters.case_type) params.append('case_type', filters.case_type);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.city) params.append('city', filters.city);
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  return params.toString();
};

const fetchApplicants = async (filters: ApplicantsFilters): Promise<ApplicantsResponse> => {
  const queryString = buildQueryString(filters);
  const res = await fetch(`/api/applicants?${queryString}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch');
  }
  return res.json();
};

// ========================================
// Hook
// ========================================

export function useApplicants(initialFilters: ApplicantsFilters = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ApplicantsFilters>({
    status: ApplicantStatus.PENDING_APPROVAL,
    case_type: CaseType.WEDDING,
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  // Update filters when initialFilters change (e.g., when switching tabs)
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...initialFilters,
    }));
  }, [initialFilters]);

  // Stable query key
  const queryKey = useMemo(() => applicantsKeys.list(filters), [filters]);

  // Query
  const { data, error, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchApplicants(filters),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // ========================================
  // Mutations
  // ========================================

  const approveMutation = useMutation({
    mutationFn: async (applicantId: string) => {
      const res = await fetch(`/api/applicants/${applicantId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to approve applicant');
      }
      return res.json() as Promise<ApproveResponse>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: applicantsKeys.all });
      toast.success(result.message, {
        description: 'עכשיו אתה מועבר לתיק החדש...',
      });
      setTimeout(() => {
        router.push(`/cases/${result.case.id}`);
      }, 1500);
    },
    onError: (error: Error) => {
      toast.error('שגיאה באישור בקשה', {
        description: error.message || 'לא ניתן לאשר את הבקשה. נסה שוב מאוחר יותר.',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ applicantId, reason }: { applicantId: string; reason?: string }) => {
      const res = await fetch(`/api/applicants/${applicantId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject applicant');
      }
      return res.json() as Promise<RejectResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicantsKeys.all });
      toast.info('הבקשה נדחתה', {
        description: 'ניתן לשחזר את הבקשה תוך 30 יום',
      });
    },
    onError: (error: Error) => {
      toast.error('שגיאה בדחיית בקשה', {
        description: error.message || 'לא ניתן לדחות את הבקשה. נסה שוב מאוחר יותר.',
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (applicantId: string) => {
      const res = await fetch(`/api/applicants/${applicantId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to restore applicant');
      }
      return res.json() as Promise<RestoreResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicantsKeys.all });
      toast.success('הבקשה שוחזרה בהצלחה', {
        description: 'כעת ניתן לאשר את הבקשה',
      });
    },
    onError: (error: Error) => {
      toast.error('שגיאה בשחזור בקשה', {
        description: error.message || 'לא ניתן לשחזר את הבקשה. נסה שוב מאוחר יותר.',
      });
    },
  });

  // ========================================
  // Actions (backward compatible API)
  // ========================================

  const approveApplicant = useCallback(
    async (
      applicantId: string,
      options?: {
        onSuccess?: (caseId: string, caseNumber: string) => void;
        onError?: (error: Error) => void;
      }
    ) => {
      try {
        const result = await approveMutation.mutateAsync(applicantId);
        if (options?.onSuccess) {
          options.onSuccess(result.case.id, result.case.case_number_formatted);
        }
        return result;
      } catch (error) {
        if (options?.onError) {
          options.onError(error as Error);
        }
        throw error;
      }
    },
    [approveMutation]
  );

  const rejectApplicant = useCallback(
    async (
      applicantId: string,
      reason?: string,
      options?: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
      }
    ) => {
      try {
        const result = await rejectMutation.mutateAsync({ applicantId, reason });
        if (options?.onSuccess) {
          options.onSuccess();
        }
        return result;
      } catch (error) {
        if (options?.onError) {
          options.onError(error as Error);
        }
        throw error;
      }
    },
    [rejectMutation]
  );

  const restoreApplicant = useCallback(
    async (
      applicantId: string,
      options?: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
      }
    ) => {
      try {
        const result = await restoreMutation.mutateAsync(applicantId);
        if (options?.onSuccess) {
          options.onSuccess();
        }
        return result;
      } catch (error) {
        if (options?.onError) {
          options.onError(error as Error);
        }
        throw error;
      }
    },
    [restoreMutation]
  );

  // ========================================
  // Filter Actions
  // ========================================

  const updateFilters = useCallback((newFilters: Partial<ApplicantsFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: ApplicantStatus.PENDING_APPROVAL,
      case_type: CaseType.WEDDING,
      page: 1,
      limit: 20,
    });
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // ========================================
  // Return
  // ========================================

  return {
    // Data (backward compatible)
    data: data?.data || [],
    applicants: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,

    // Filters
    filters,
    updateFilters,
    resetFilters,
    goToPage,

    // Actions
    approveApplicant,
    rejectApplicant,
    restoreApplicant,

    // Refetch (backward compatible)
    refetch,
    refresh: refetch,
  };
}

// ========================================
// Backward Compatible Mutation Hooks
// ========================================

/**
 * Hook לאישור בקשה (backward compatible)
 */
export function useApproveApplicant() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (applicantId: string) => {
      const res = await fetch(`/api/applicants/${applicantId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to approve applicant');
      }
      return res.json() as Promise<ApproveResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicantsKeys.all });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

/**
 * Hook לדחיית בקשה (backward compatible)
 */
export function useRejectApplicant() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ applicantId, reason }: { applicantId: string; reason?: string }) => {
      const res = await fetch(`/api/applicants/${applicantId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject applicant');
      }
      return res.json() as Promise<RejectResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicantsKeys.all });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

/**
 * Hook לשחזור בקשה (backward compatible)
 */
export function useRestoreApplicant() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (applicantId: string) => {
      const res = await fetch(`/api/applicants/${applicantId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to restore applicant');
      }
      return res.json() as Promise<RestoreResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicantsKeys.all });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

// Export Applicant type for backward compatibility
export type { Applicant };
