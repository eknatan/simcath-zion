/**
 * Custom Hook: useTransfers
 *
 * ניהול העברות בנקאיות עם SWR
 *
 * עקרונות SOLID:
 * - Single Responsibility: מטפל רק בניהול נתוני העברות
 * - Open/Closed: ניתן להרחבה ללוגיקות נוספות
 * - Dependency Inversion: תלוי ב-service abstraction
 * - i18n Support: כל ההודעות מתורגמות
 */

'use client';

import useSWR from 'swr';
import { useState, useCallback } from 'react';
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
// Hook
// ========================================

export function useTransfers({
  paymentType,
  initialFilters = {},
  showTransferred = false,
}: UseTransfersOptions): UseTransfersReturn {
  const t = useTranslations('transfers');

  const [filters, setFiltersState] = useState<TransferFilters>({
    ...(paymentType && { payment_type: paymentType }),
    status: PaymentStatus.APPROVED,
    ...initialFilters,
  });

  // Build unique key for SWR
  const swrKey = ['transfers', paymentType, showTransferred, JSON.stringify(filters)];

  // Fetch data with SWR
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      const supabase = createClient();

      let query = supabase
        .from('payments')
        .select(
          `
          *,
          cases!inner (
            id,
            case_number,
            case_type,
            status,
            groom_first_name,
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
        // Show transferred payments (status='transferred' OR has transferred_at)
        query = query
          .eq('status', PaymentStatus.TRANSFERRED)
          .not('transferred_at', 'is', null);
      } else {
        // Show pending payments (status='approved' AND no transferred_at)
        query = query
          .eq('status', PaymentStatus.APPROVED)
          .is('transferred_at', null);
      }

      // Filter by payment type only if specified (null means "ALL")
      if (paymentType) {
        query = query.eq('payment_type', paymentType);
      }

      // Apply filters
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.amount_min !== undefined) {
        query = query.gte('amount_ils', filters.amount_min);
      }
      if (filters.amount_max !== undefined) {
        query = query.lte('amount_ils', filters.amount_max);
      }
      if (filters.city && paymentType === PaymentType.WEDDING_TRANSFER) {
        query = query.eq('cases.city', filters.city);
      }
      if (filters.payment_month && paymentType === PaymentType.MONTHLY_CLEANING) {
        query = query.eq('payment_month', filters.payment_month);
      }
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `cases.case_number.ilike.${searchTerm},` +
            `cases.groom_first_name.ilike.${searchTerm},` +
            `cases.bride_first_name.ilike.${searchTerm},` +
            `cases.family_name.ilike.${searchTerm},` +
            `cases.child_name.ilike.${searchTerm},` +
            `bank_details.account_holder_name.ilike.${searchTerm}`
        );
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Map the data to rename 'cases' to 'case' and extract bank_details
      return (data || []).map((item: any) => {
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
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  );

  const transfers = data || [];
  const summary = calculateTransferSummary(transfers);

  // ========================================
  // Filter Management
  // ========================================

  const setFilters = useCallback((newFilters: TransferFilters) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      ...(paymentType && { payment_type: paymentType }), // Keep payment_type if specified
    }));
  }, [paymentType]);

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
      await mutate();
    } catch (error) {
      console.error('Failed to refresh transfers:', error);
      notifyError(t('errors.refreshFailed'));
    }
  }, [mutate, t]);

  const updateStatus = useCallback(
    async (ids: string[], status: PaymentStatus) => {
      try {
        await bulkUpdateTransfers(ids, { status });
        await mutate(); // Refresh data
        notifySuccess(t('success.statusUpdated'));
      } catch (error) {
        console.error('Failed to update status:', error);
        notifyError(t('errors.statusUpdateFailed'));
        throw error;
      }
    },
    [mutate, t]
  );

  const markAsTransferred = useCallback(
    async (ids: string[], receiptRef?: string) => {
      try {
        await markTransfersAsTransferred(ids, receiptRef);
        await mutate(); // Refresh data
        notifySuccess(t('success.transfersMarked', { count: ids.length }));
      } catch (error) {
        console.error('Failed to mark as transferred:', error);
        notifyError(t('errors.transferMarkFailed'));
        throw error;
      }
    },
    [mutate, t]
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
