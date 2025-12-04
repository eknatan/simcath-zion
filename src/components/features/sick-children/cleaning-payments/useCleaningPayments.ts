'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { Payment } from '@/types/case.types';
import {
  HEBREW_MONTHS,
  type PaymentFormValues,
  type UseCleaningPaymentsReturn
} from './types';

/**
 * useCleaningPayments - Hook for managing monthly payments
 *
 * Handles all payment CRUD operations and state management.
 * Separated from UI following Dependency Inversion principle.
 *
 * @param caseId - The case ID to manage payments for
 */
export function useCleaningPayments(caseId: string): UseCleaningPaymentsReturn {
  const t = useTranslations('sickChildren.payments');
  const queryClient = useQueryClient();

  // Filter state
  const [filterYear, setFilterYear] = useState<string>('all');

  // Generate years for dropdown (2020 to current + 1)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from(
      { length: currentYear - 2020 + 2 },
      (_, i) => (2020 + i).toString()
    );
  }, []);

  // Query key for this case's payments
  const queryKey = ['cleaning-payments', caseId];

  // Fetch payments using React Query
  const {
    data,
    isLoading,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/cleaning-cases/${caseId}/payments`);
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
  });

  const payments: Payment[] = useMemo(() => data?.payments || [], [data?.payments]);
  const monthlyCap: number = data?.summary?.monthlyCap || 720;

  // Add payment mutation
  const addMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      const paymentMonth = `${values.year}-${values.month.padStart(2, '0')}-01`;
      const response = await fetch(`/api/cleaning-cases/${caseId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_month: paymentMonth,
          amount_ils: parseFloat(values.amount),
          notes: values.notes || undefined,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          const monthName = HEBREW_MONTHS[parseInt(values.month) - 1];
          throw new Error(t('duplicateMonth', { month: monthName, year: values.year }));
        }
        throw new Error(responseData.error || t('errorSaving'));
      }

      return responseData;
    },
    onSuccess: () => {
      toast.success(t('paymentSaved'));
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update payment mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: PaymentFormValues }) => {
      const paymentMonth = `${values.year}-${values.month.padStart(2, '0')}-01`;
      const response = await fetch(
        `/api/cleaning-cases/${caseId}/payments?paymentId=${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_month: paymentMonth,
            amount_ils: parseFloat(values.amount),
            notes: values.notes || undefined,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          const monthName = HEBREW_MONTHS[parseInt(values.month) - 1];
          throw new Error(t('duplicateMonth', { month: monthName, year: values.year }));
        }
        throw new Error(responseData.error || t('errorUpdating'));
      }

      return responseData;
    },
    onSuccess: () => {
      toast.success(t('paymentUpdated'));
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete payment mutation
  const deleteMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(
        `/api/cleaning-cases/${caseId}/payments?paymentId=${paymentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || t('errorDeleting'));
      }

      return true;
    },
    onSuccess: () => {
      toast.success(t('paymentDeleted'));
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Filter payments by year
  const filteredPayments = useMemo(() => {
    if (filterYear === 'all') return payments;
    return payments.filter(p => {
      if (!p.payment_month) return false;
      const paymentYear = new Date(p.payment_month).getFullYear().toString();
      return paymentYear === filterYear;
    });
  }, [payments, filterYear]);

  // Calculate total for filtered payments
  const filteredTotal = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (p.amount_ils || 0), 0);
  }, [filteredPayments]);

  // Format month display
  const formatPaymentMonth = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return `${HEBREW_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }, []);

  // Action handlers with validation
  const addPayment = useCallback(async (values: PaymentFormValues): Promise<boolean> => {
    // Validate
    if (!values.month || !values.year || !values.amount) {
      toast.error(t('fillAllFields'));
      return false;
    }

    const numAmount = parseFloat(values.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(t('invalidAmount'));
      return false;
    }

    try {
      await addMutation.mutateAsync(values);
      return true;
    } catch {
      return false;
    }
  }, [addMutation, t]);

  const updatePayment = useCallback(async (id: string, values: PaymentFormValues): Promise<boolean> => {
    // Validate
    if (!values.month || !values.year || !values.amount) {
      toast.error(t('fillAllFields'));
      return false;
    }

    const numAmount = parseFloat(values.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(t('invalidAmount'));
      return false;
    }

    try {
      await updateMutation.mutateAsync({ id, values });
      return true;
    } catch {
      return false;
    }
  }, [updateMutation, t]);

  const deletePayment = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  }, [deleteMutation]);

  return {
    // Data
    payments,
    filteredPayments,
    monthlyCap,
    filteredTotal,

    // Loading states
    isLoading,
    isSaving: addMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Filter
    filterYear,
    setFilterYear,

    // Actions
    addPayment,
    updatePayment,
    deletePayment,
    refetch,

    // Utilities
    formatPaymentMonth,
    years,
  };
}
