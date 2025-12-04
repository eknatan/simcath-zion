/**
 * Custom Hook: useTransfers
 *
 * ניהול העברות בנקאיות עם React Query
 *
 * עקרונות SOLID:
 * - Single Responsibility: מטפל רק בניהול נתוני העברות
 * - Open/Closed: ניתן להרחבה ללוגיקות נוספות
 * - Dependency Inversion: תלוי ב-service abstraction
 * - i18n Support: כל ההודעות מתורגמות
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { notifySuccess, notifyError } from '@/lib/utils/notifications';
import { createClient } from '@/lib/supabase/client';
import {
  TransferWithDetails,
  TransferFilters,
  TransferSummary,
} from '@/types/transfers.types';
import { PaymentType, PaymentStatus } from '@/types/case.types';
import {
  calculateTransferSummary,
  bulkUpdateTransfers,
  markTransfersAsTransferred,
} from '@/lib/services/transfers.service';

// ========================================
// Types
// ========================================

interface UseTransfersOptions {
  paymentType?: PaymentType | null; // null means "ALL"
  initialFilters?: TransferFilters;
  showTransferred?: boolean; // true = show transferred, false = show pending
}

interface UseTransfersReturn {
  // Data
  transfers: TransferWithDetails[];
  summary: TransferSummary;
  isLoading: boolean;
  error: Error | null;

  // Filters
  filters: TransferFilters;
  setFilters: (filters: TransferFilters) => void;
  resetFilters: () => void;

  // Actions
  refresh: () => Promise<void>;
  updateStatus: (ids: string[], status: PaymentStatus) => Promise<void>;
  markAsTransferred: (ids: string[], receiptRef?: string) => Promise<void>;
}

// ========================================
// Query Keys Factory
// ========================================

const transfersKeys = {
  all: ['transfers'] as const,
  list: (
    paymentType: PaymentType | null | undefined,
    showTransferred: boolean,
    filters: TransferFilters
  ) => [...transfersKeys.all, paymentType, showTransferred, filters] as const,
};

// ========================================
// Fetch Function
// ========================================

async function fetchTransfers(
  paymentType: PaymentType | null | undefined,
  showTransferred: boolean,
  filters: TransferFilters
): Promise<TransferWithDetails[]> {
  const supabase = createClient();

  let query = supabase.from('payments').select(
    `
      *,
      cases!inner (
        id,
        case_number,
        case_type,
        status,
        groom_first_name,
        groom_last_name,
        bride_first_name,
        bride_last_name,
        wedding_date_gregorian,
        family_name,
        child_name,
        city,
        bank_details (
          id,
          bank_number,
          branch,
          account_number,
          account_holder_name
        )
      )
    `
  );

  // Filter by transferred status
  if (showTransferred) {
    query = query
      .eq('status', PaymentStatus.TRANSFERRED)
      .not('transferred_at', 'is', null);
  } else {
    query = query.eq('status', PaymentStatus.APPROVED).is('transferred_at', null);
  }

  // Filter by payment type only if specified (null means "ALL")
  if (paymentType) {
    query = query.eq('payment_type', paymentType);
  }

  // Apply date filters
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  // Apply amount filters
  if (filters.amount_min !== undefined) {
    query = query.gte('amount_ils', filters.amount_min);
  }
  if (filters.amount_max !== undefined) {
    query = query.lte('amount_ils', filters.amount_max);
  }

  // Apply city filter for wedding transfers
  if (filters.city && paymentType === PaymentType.WEDDING_TRANSFER) {
    query = query.eq('cases.city', filters.city);
  }

  // Apply payment month filter for cleaning
  if (filters.payment_month && paymentType === PaymentType.MONTHLY_CLEANING) {
    query = query.eq('payment_month', filters.payment_month);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Map the data to rename 'cases' to 'case' and extract bank_details
  let results = (data || []).map((item: any) => {
    const bankDetails = item.cases?.bank_details;
    // bank_details might be an array (one-to-one) or object, handle both
    const normalizedBankDetails = Array.isArray(bankDetails)
      ? bankDetails[0]
      : bankDetails;

    return {
      ...item,
      case: item.cases,
      bank_details: normalizedBankDetails,
    };
  }) as TransferWithDetails[];

  // Client-side search filter (Supabase doesn't support .or() on nested relations)
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.trim().toLowerCase();
    results = results.filter((item) => {
      const caseData = item.case;
      const bankDetails = item.bank_details;

      // Search in case fields
      const caseNumber = String(caseData?.case_number || '').toLowerCase();
      const groomName = (caseData?.groom_first_name || '').toLowerCase();
      const groomLastName = (caseData?.groom_last_name || '').toLowerCase();
      const brideName = (caseData?.bride_first_name || '').toLowerCase();
      const brideLastName = (caseData?.bride_last_name || '').toLowerCase();
      const familyName = (caseData?.family_name || '').toLowerCase();
      const childName = (caseData?.child_name || '').toLowerCase();

      // Search in bank details
      const accountHolder = (bankDetails?.account_holder_name || '').toLowerCase();

      return (
        caseNumber.includes(searchTerm) ||
        groomName.includes(searchTerm) ||
        groomLastName.includes(searchTerm) ||
        brideName.includes(searchTerm) ||
        brideLastName.includes(searchTerm) ||
        familyName.includes(searchTerm) ||
        childName.includes(searchTerm) ||
        accountHolder.includes(searchTerm)
      );
    });
  }

  return results;
}

// ========================================
// Hook
// ========================================

export function useTransfers({
  paymentType,
  initialFilters = {},
  showTransferred = false,
}: UseTransfersOptions): UseTransfersReturn {
  const t = useTranslations('transfers');
  const queryClient = useQueryClient();

  const [filters, setFiltersState] = useState<TransferFilters>({
    ...(paymentType && { payment_type: paymentType }),
    status: PaymentStatus.APPROVED,
    ...initialFilters,
  });

  // Create stable query key using useMemo
  const queryKey = useMemo(
    () => transfersKeys.list(paymentType, showTransferred, filters),
    [paymentType, showTransferred, filters]
  );

  // Fetch data with React Query
  const {
    data: transfers = [],
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchTransfers(paymentType, showTransferred, filters),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Calculate summary
  const summary = useMemo(
    () => calculateTransferSummary(transfers),
    [transfers]
  );

  // ========================================
  // Mutations
  // ========================================

  const updateStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: PaymentStatus }) =>
      bulkUpdateTransfers(ids, { status }),
    onSuccess: () => {
      // Invalidate all transfer queries
      queryClient.invalidateQueries({ queryKey: transfersKeys.all });
      notifySuccess(t('success.statusUpdated'));
    },
    onError: (error) => {
      console.error('Failed to update status:', error);
      notifyError(t('errors.statusUpdateFailed'));
    },
  });

  const markAsTransferredMutation = useMutation({
    mutationFn: ({ ids, receiptRef }: { ids: string[]; receiptRef?: string }) =>
      markTransfersAsTransferred(ids, receiptRef),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: transfersKeys.all });
      notifySuccess(t('success.transfersMarked', { count: variables.ids.length }));
    },
    onError: (error) => {
      console.error('Failed to mark as transferred:', error);
      notifyError(t('errors.transferMarkFailed'));
    },
  });

  // ========================================
  // Filter Management
  // ========================================

  const setFilters = useCallback(
    (newFilters: TransferFilters) => {
      setFiltersState((prev) => ({
        ...prev,
        ...newFilters,
        ...(paymentType && { payment_type: paymentType }),
      }));
    },
    [paymentType]
  );

  const resetFilters = useCallback(() => {
    setFiltersState({
      ...(paymentType && { payment_type: paymentType }),
      status: PaymentStatus.APPROVED,
    });
  }, [paymentType]);

  // ========================================
  // Actions
  // ========================================

  const refresh = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh transfers:', error);
      notifyError(t('errors.refreshFailed'));
    }
  }, [refetch, t]);

  const updateStatus = useCallback(
    async (ids: string[], status: PaymentStatus) => {
      await updateStatusMutation.mutateAsync({ ids, status });
    },
    [updateStatusMutation]
  );

  const markAsTransferred = useCallback(
    async (ids: string[], receiptRef?: string) => {
      await markAsTransferredMutation.mutateAsync({ ids, receiptRef });
    },
    [markAsTransferredMutation]
  );

  return {
    // Data
    transfers,
    summary,
    isLoading,
    error: error || null,

    // Filters
    filters,
    setFilters,
    resetFilters,

    // Actions
    refresh,
    updateStatus,
    markAsTransferred,
  };
}
