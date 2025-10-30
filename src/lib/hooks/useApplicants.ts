/**
 * Custom Hook: useApplicants
 *
 * ניהול בקשות (applicants) עם SWR
 *
 * עקרונות SOLID:
 * - Single Responsibility: מטפל רק בניהול נתוני בקשות
 * - Open/Closed: ניתן להרחבה ללוגיקות נוספות
 * - Dependency Inversion: תלוי ב-API abstraction
 */

'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';
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
// Fetcher Functions
// ========================================

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch');
  }
  return res.json();
};

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

// ========================================
// Hook
// ========================================

export function useApplicants(initialFilters: ApplicantsFilters = {}) {
  const router = useRouter();
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
  }, [initialFilters.status, initialFilters.case_type]);

  const queryString = buildQueryString(filters);
  const { data, error, isLoading, mutate } = useSWR<ApplicantsResponse>(
    `/api/applicants?${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // ========================================
  // Actions
  // ========================================

  /**
   * אישור בקשה ויצירת תיק
   */
  const approveApplicant = async (
    applicantId: string,
    options?: {
      onSuccess?: (caseId: string, caseNumber: string) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    try {
      const res = await fetch(`/api/applicants/${applicantId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to approve applicant');
      }

      const result: ApproveResponse = await res.json();

      // Optimistic update - remove from list
      await mutate();

      // Success callback
      if (options?.onSuccess) {
        options.onSuccess(
          result.case.id,
          result.case.case_number_formatted
        );
      }

      // Success toast
      toast.success(result.message, {
        description: 'עכשיו אתה מועבר לתיק החדש...',
      });

      // Navigate to new case
      setTimeout(() => {
        router.push(`/cases/${result.case.id}`);
      }, 1500);

      return result;
    } catch (error) {
      console.error('Error approving applicant:', error);

      // Error callback
      if (options?.onError) {
        options.onError(error as Error);
      }

      // Error toast
      toast.error('שגיאה באישור בקשה', {
        description:
          error instanceof Error
            ? error.message
            : 'לא ניתן לאשר את הבקשה. נסה שוב מאוחר יותר.',
      });

      throw error;
    }
  };

  /**
   * דחיית בקשה
   */
  const rejectApplicant = async (
    applicantId: string,
    reason?: string,
    options?: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    try {
      const res = await fetch(`/api/applicants/${applicantId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject applicant');
      }

      const result: RejectResponse = await res.json();

      // Optimistic update
      await mutate();

      // Success callback
      if (options?.onSuccess) {
        options.onSuccess();
      }

      // Success toast
      toast.info('הבקשה נדחתה', {
        description: 'ניתן לשחזר את הבקשה תוך 30 יום',
      });

      return result;
    } catch (error) {
      console.error('Error rejecting applicant:', error);

      // Error callback
      if (options?.onError) {
        options.onError(error as Error);
      }

      // Error toast
      toast.error('שגיאה בדחיית בקשה', {
        description:
          error instanceof Error
            ? error.message
            : 'לא ניתן לדחות את הבקשה. נסה שוב מאוחר יותר.',
      });

      throw error;
    }
  };

  /**
   * שחזור בקשה נדחית
   */
  const restoreApplicant = async (
    applicantId: string,
    options?: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    try {
      const res = await fetch(`/api/applicants/${applicantId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to restore applicant');
      }

      const result: RestoreResponse = await res.json();

      // Optimistic update
      await mutate();

      // Success callback
      if (options?.onSuccess) {
        options.onSuccess();
      }

      // Success toast
      toast.success('הבקשה שוחזרה בהצלחה', {
        description: 'כעת ניתן לאשר את הבקשה',
      });

      return result;
    } catch (error) {
      console.error('Error restoring applicant:', error);

      // Error callback
      if (options?.onError) {
        options.onError(error as Error);
      }

      // Error toast
      toast.error('שגיאה בשחזור בקשה', {
        description:
          error instanceof Error
            ? error.message
            : 'לא ניתן לשחזר את הבקשה. נסה שוב מאוחר יותר.',
      });

      throw error;
    }
  };

  // ========================================
  // Filter Actions
  // ========================================

  const updateFilters = (newFilters: Partial<ApplicantsFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1, // Reset page on filter change
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: ApplicantStatus.PENDING_APPROVAL,
      case_type: CaseType.WEDDING,
      page: 1,
      limit: 20,
    });
  };

  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

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
    refetch: mutate,
    refresh: mutate,
  };
}

// ========================================
// Backward Compatible Mutation Hooks
// ========================================

/**
 * Hook לאישור בקשה (backward compatible)
 */
export function useApproveApplicant() {
  const router = useRouter();

  const mutateAsync = async (applicantId: string) => {
    const res = await fetch(`/api/applicants/${applicantId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to approve applicant');
    }

    const result: ApproveResponse = await res.json();
    return result;
  };

  return {
    mutateAsync,
    isPending: false, // TODO: Add loading state if needed
  };
}

/**
 * Hook לדחיית בקשה (backward compatible)
 */
export function useRejectApplicant() {
  const mutateAsync = async ({
    applicantId,
    reason,
  }: {
    applicantId: string;
    reason?: string;
  }) => {
    const res = await fetch(`/api/applicants/${applicantId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to reject applicant');
    }

    const result: RejectResponse = await res.json();
    return result;
  };

  return {
    mutateAsync,
    isPending: false,
  };
}

/**
 * Hook לשחזור בקשה (backward compatible)
 */
export function useRestoreApplicant() {
  const mutateAsync = async (applicantId: string) => {
    const res = await fetch(`/api/applicants/${applicantId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to restore applicant');
    }

    const result: RestoreResponse = await res.json();
    return result;
  };

  return {
    mutateAsync,
    isPending: false,
  };
}

// Export Applicant type for backward compatibility
export type { Applicant };
