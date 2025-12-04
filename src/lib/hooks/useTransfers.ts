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
// Fetch Function (using PostgreSQL RPC for server-side search)
// ========================================

async function fetchTransfers(
  paymentType: PaymentType | null | undefined,
  showTransferred: boolean,
  filters: TransferFilters
): Promise<TransferWithDetails[]> {
  const supabase = createClient();

  // Use server-side search function for better performance
  const { data, error } = await supabase.rpc('search_transfers', {
    p_search_term: filters.search?.trim() || null,
    p_payment_type: paymentType || null,
    p_show_transferred: showTransferred,
    p_date_from: filters.date_from || null,
    p_date_to: filters.date_to || null,
    p_amount_min: filters.amount_min ?? null,
    p_amount_max: filters.amount_max ?? null,
    p_city: (paymentType === PaymentType.WEDDING_TRANSFER && filters.city) ? filters.city : null,
    p_payment_month: (paymentType === PaymentType.MONTHLY_CLEANING && filters.payment_month) ? filters.payment_month : null,
  });

  if (error) {
    throw error;
  }

  // Map the RPC response to match TransferWithDetails structure
  const results = (data || []).map((item: any) => ({
    id: item.id,
    case_id: item.case_id,
    payment_type: item.payment_type,
    payment_month: item.payment_month,
    amount_usd: item.amount_usd,
    amount_ils: item.amount_ils,
    exchange_rate: item.exchange_rate,
    approved_amount: item.approved_amount,
    approved_by: item.approved_by,
    transferred_at: item.transferred_at,
    receipt_reference: item.receipt_reference,
    notes: item.notes,
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
    case: item.case_data,
    bank_details: item.bank_details,
  })) as TransferWithDetails[];

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
