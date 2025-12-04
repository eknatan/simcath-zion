'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type {
  Payment,
  PaymentWithUser,
  PaymentApprovalData,
  MonthlyPaymentData,
  BankDetailsFormData,
} from '@/types/case.types';
import { caseKeys } from './useCase';

// ========================================
// Query Keys
// ========================================

export const casePaymentsKeys = {
  all: ['casePayments'] as const,
  list: (caseId: string) => [...casePaymentsKeys.all, caseId] as const,
  bankDetails: (caseId: string) => ['bankDetails', caseId] as const,
};

// ========================================
// Fetchers
// ========================================

const fetchPayments = async (caseId: string): Promise<PaymentWithUser[]> => {
  const response = await fetch(`/api/cases/${caseId}/payments`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch payments');
  }
  return response.json();
};

const fetchBankDetails = async (
  caseId: string
): Promise<BankDetailsFormData | null> => {
  const response = await fetch(`/api/cases/${caseId}/bank-details`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch bank details');
  }
  return response.json();
};

/**
 * Custom hook for managing case payments
 *
 * Provides:
 * - Payments list with React Query caching
 * - Bank details management
 * - Payment approval flow
 * - Monthly payment creation (for cleaning cases)
 * - Error handling and loading states
 * - Toast notifications
 *
 * @param caseId - The ID of the case to manage payments for
 */
export function useCasePayments(caseId: string) {
  const t = useTranslations('payments');
  const queryClient = useQueryClient();

  // ========================================
  // Queries
  // ========================================

  const {
    data: payments,
    error: paymentsError,
    isLoading: isLoadingPayments,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: casePaymentsKeys.list(caseId),
    queryFn: () => fetchPayments(caseId),
    enabled: !!caseId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const {
    data: bankDetails,
    error: bankDetailsError,
    isLoading: isLoadingBankDetails,
    refetch: refetchBankDetails,
  } = useQuery({
    queryKey: casePaymentsKeys.bankDetails(caseId),
    queryFn: () => fetchBankDetails(caseId),
    enabled: !!caseId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // ========================================
  // Mutations
  // ========================================

  const saveBankDetailsMutation = useMutation({
    mutationFn: async (data: BankDetailsFormData) => {
      const response = await fetch(`/api/cases/${caseId}/bank-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save bank details');
      }
      return response.json();
    },
    onSuccess: (savedDetails) => {
      queryClient.setQueryData(
        casePaymentsKeys.bankDetails(caseId),
        savedDetails
      );
      toast.success(t('bankDetails.saveSuccess'));
    },
    onError: (error: Error) => {
      toast.error(t('bankDetails.saveError'), {
        description: error.message || t('errors.tryAgainLater'),
      });
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: async (approvalData: PaymentApprovalData) => {
      const response = await fetch(`/api/cases/${caseId}/payments/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve payment');
      }
      return response.json() as Promise<Payment>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: casePaymentsKeys.list(caseId),
      });
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success(t('approval.success'), {
        description: t('approval.successDescription'),
      });
    },
    onError: (error: Error) => {
      toast.error(t('approval.error'), {
        description: error.message || t('errors.tryAgainLater'),
      });
    },
  });

  const createMonthlyPaymentMutation = useMutation({
    mutationFn: async (monthlyData: MonthlyPaymentData) => {
      const response = await fetch(`/api/cases/${caseId}/payments/monthly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monthlyData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create monthly payment');
      }
      return response.json() as Promise<Payment>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: casePaymentsKeys.list(caseId),
      });
      toast.success(t('monthly.success'));
    },
    onError: (error: Error) => {
      toast.error(t('monthly.error'), {
        description: error.message || t('errors.tryAgainLater'),
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(
        `/api/cases/${caseId}/payments/${paymentId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete payment');
      }
      return paymentId;
    },
    onMutate: async (paymentId) => {
      await queryClient.cancelQueries({
        queryKey: casePaymentsKeys.list(caseId),
      });
      const previousPayments = queryClient.getQueryData<PaymentWithUser[]>(
        casePaymentsKeys.list(caseId)
      );
      queryClient.setQueryData<PaymentWithUser[]>(
        casePaymentsKeys.list(caseId),
        (old) => old?.filter((p) => p.id !== paymentId) || []
      );
      return { previousPayments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success(t('delete.success'));
    },
    onError: (error: Error, _paymentId, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(
          casePaymentsKeys.list(caseId),
          context.previousPayments
        );
      }
      toast.error(t('delete.error'), {
        description: error.message || t('errors.tryAgainLater'),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: casePaymentsKeys.list(caseId),
      });
    },
  });

  // ========================================
  // Actions (backward compatible)
  // ========================================

  const saveBankDetails = useCallback(
    async (data: BankDetailsFormData): Promise<boolean> => {
      if (!caseId) {
        toast.error(t('errors.invalidCase'));
        return false;
      }
      try {
        await saveBankDetailsMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    },
    [caseId, saveBankDetailsMutation, t]
  );

  const approvePayment = useCallback(
    async (approvalData: PaymentApprovalData): Promise<Payment | null> => {
      if (!caseId) {
        toast.error(t('errors.invalidCase'));
        return null;
      }
      if (!bankDetails) {
        toast.error(t('errors.missingBankDetails'), {
          description: t('errors.pleaseFillBankDetails'),
        });
        return null;
      }
      try {
        return await approvePaymentMutation.mutateAsync(approvalData);
      } catch {
        return null;
      }
    },
    [caseId, bankDetails, approvePaymentMutation, t]
  );

  const createMonthlyPayment = useCallback(
    async (monthlyData: MonthlyPaymentData): Promise<Payment | null> => {
      if (!caseId) {
        toast.error(t('errors.invalidCase'));
        return null;
      }
      if (!bankDetails) {
        toast.error(t('errors.missingBankDetails'), {
          description: t('errors.pleaseFillBankDetails'),
        });
        return null;
      }
      try {
        return await createMonthlyPaymentMutation.mutateAsync(monthlyData);
      } catch {
        return null;
      }
    },
    [caseId, bankDetails, createMonthlyPaymentMutation, t]
  );

  const deletePayment = useCallback(
    async (paymentId: string): Promise<boolean> => {
      if (!caseId) {
        toast.error(t('errors.invalidCase'));
        return false;
      }
      try {
        await deletePaymentMutation.mutateAsync(paymentId);
        return true;
      } catch {
        return false;
      }
    },
    [caseId, deletePaymentMutation, t]
  );

  const refreshPayments = useCallback(async () => {
    try {
      await refetchPayments();
    } catch (error) {
      console.error('Failed to refresh payments:', error);
      toast.error(t('errors.refreshFailed'));
    }
  }, [refetchPayments, t]);

  const refreshBankDetails = useCallback(async () => {
    try {
      await refetchBankDetails();
    } catch (error) {
      console.error('Failed to refresh bank details:', error);
      toast.error(t('errors.refreshFailed'));
    }
  }, [refetchBankDetails, t]);

  // Backward compatible mutate functions
  const mutatePayments = useCallback(
    (data?: PaymentWithUser[]) => {
      if (data) {
        queryClient.setQueryData(casePaymentsKeys.list(caseId), data);
      } else {
        queryClient.invalidateQueries({
          queryKey: casePaymentsKeys.list(caseId),
        });
      }
    },
    [queryClient, caseId]
  );

  const mutateBankDetails = useCallback(
    (data?: BankDetailsFormData | null) => {
      if (data !== undefined) {
        queryClient.setQueryData(casePaymentsKeys.bankDetails(caseId), data);
      } else {
        queryClient.invalidateQueries({
          queryKey: casePaymentsKeys.bankDetails(caseId),
        });
      }
    },
    [queryClient, caseId]
  );

  // ========================================
  // Return Hook Interface
  // ========================================
  return {
    // Data
    payments: payments || [],
    bankDetails: bankDetails || null,

    // States
    isLoadingPayments,
    isLoadingBankDetails,
    isApproving: approvePaymentMutation.isPending,
    isCreatingPayment: createMonthlyPaymentMutation.isPending,
    isSavingBankDetails: saveBankDetailsMutation.isPending,
    isDeletingPayment: deletePaymentMutation.isPending
      ? deletePaymentMutation.variables
      : null,
    paymentsError,
    bankDetailsError,

    // Actions
    saveBankDetails,
    approvePayment,
    createMonthlyPayment,
    deletePayment,
    refreshPayments,
    refreshBankDetails,

    // Mutate functions (for advanced use)
    mutatePayments,
    mutateBankDetails,
  };
}

/**
 * Type for the hook return value
 */
export type UseCasePaymentsReturn = ReturnType<typeof useCasePayments>;
