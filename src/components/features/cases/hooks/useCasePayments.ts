'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type {
  Payment,
  PaymentWithUser,
  PaymentApprovalData,
  MonthlyPaymentData,
  BankDetailsFormData,
} from '@/types/case.types';

/**
 * Fetcher function for SWR - Payments
 */
const paymentsFetcher = async (url: string): Promise<PaymentWithUser[]> => {
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch payments');
  }

  return response.json();
};

/**
 * Fetcher function for SWR - Bank Details
 */
const bankDetailsFetcher = async (url: string): Promise<BankDetailsFormData | null> => {
  const response = await fetch(url);

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
 * - Payments list with SWR caching and revalidation
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

  // ========================================
  // State Management
  // ========================================
  const [isApproving, setIsApproving] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isSavingBankDetails, setIsSavingBankDetails] = useState(false);
  const [isDeletingPayment, setIsDeletingPayment] = useState<string | null>(null);

  // ========================================
  // SWR Hook - Payments List
  // ========================================
  const {
    data: payments,
    error: paymentsError,
    isLoading: isLoadingPayments,
    mutate: mutatePayments,
  } = useSWR<PaymentWithUser[]>(
    caseId ? `/api/cases/${caseId}/payments` : null,
    paymentsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 5000,
    }
  );

  // ========================================
  // SWR Hook - Bank Details
  // ========================================
  const {
    data: bankDetails,
    error: bankDetailsError,
    isLoading: isLoadingBankDetails,
    mutate: mutateBankDetails,
  } = useSWR<BankDetailsFormData | null>(
    caseId ? `/api/cases/${caseId}/bank-details` : null,
    bankDetailsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 5000,
      onSuccess: (data) => {
        console.log('[useCasePayments] Loaded bank details from API:', data);
      },
    }
  );

  // ========================================
  // Save Bank Details
  // ========================================

  /**
   * Save or update bank details for the case
   *
   * @param data - Bank details form data
   * @returns Promise that resolves when save is complete
   */
  const saveBankDetails = async (
    data: BankDetailsFormData
  ): Promise<boolean> => {
    if (!caseId) {
      toast.error(t('errors.invalidCase'));
      return false;
    }

    setIsSavingBankDetails(true);

    try {
      const response = await fetch(`/api/cases/${caseId}/bank-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save bank details');
      }

      const savedDetails = await response.json();

      console.log('[useCasePayments] Saved bank details response:', savedDetails);

      // Update local state
      await mutateBankDetails(savedDetails, false);

      console.log('[useCasePayments] Updated SWR cache with bank details');

      toast.success(t('bankDetails.saveSuccess'));
      return true;
    } catch (error) {
      console.error('Failed to save bank details:', error);
      toast.error(t('bankDetails.saveError'), {
        description:
          error instanceof Error ? error.message : t('errors.tryAgainLater'),
      });
      return false;
    } finally {
      setIsSavingBankDetails(false);
    }
  };

  // ========================================
  // Approve Payment (Wedding Cases)
  // ========================================

  /**
   * Approve a payment for wedding case
   *
   * Steps:
   * 1. Validate bank details exist
   * 2. Create payment record
   * 3. Update case status to 'pending_transfer'
   * 4. Log in audit history
   * 5. Show success notification
   *
   * @param approvalData - Payment approval data (amount, rate, etc.)
   * @returns Promise that resolves when approval is complete
   */
  const approvePayment = async (
    approvalData: PaymentApprovalData
  ): Promise<Payment | null> => {
    if (!caseId) {
      toast.error(t('errors.invalidCase'));
      return null;
    }

    // Validate bank details exist
    if (!bankDetails) {
      toast.error(t('errors.missingBankDetails'), {
        description: t('errors.pleaseFillBankDetails'),
      });
      return null;
    }

    setIsApproving(true);

    try {
      const response = await fetch(`/api/cases/${caseId}/payments/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve payment');
      }

      const payment: Payment = await response.json();

      // Refresh payments list
      await mutatePayments();

      toast.success(t('approval.success'), {
        description: t('approval.successDescription'),
      });

      return payment;
    } catch (error) {
      console.error('Failed to approve payment:', error);
      toast.error(t('approval.error'), {
        description:
          error instanceof Error ? error.message : t('errors.tryAgainLater'),
        action: {
          label: t('common.tryAgain'),
          onClick: () => approvePayment(approvalData),
        },
      });
      return null;
    } finally {
      setIsApproving(false);
    }
  };

  // ========================================
  // Create Monthly Payment (Cleaning Cases)
  // ========================================

  /**
   * Create a monthly payment for cleaning case
   *
   * @param monthlyData - Monthly payment data
   * @returns Promise that resolves when payment is created
   */
  const createMonthlyPayment = async (
    monthlyData: MonthlyPaymentData
  ): Promise<Payment | null> => {
    if (!caseId) {
      toast.error(t('errors.invalidCase'));
      return null;
    }

    // Validate bank details exist
    if (!bankDetails) {
      toast.error(t('errors.missingBankDetails'), {
        description: t('errors.pleaseFillBankDetails'),
      });
      return null;
    }

    setIsCreatingPayment(true);

    try {
      const response = await fetch(`/api/cases/${caseId}/payments/monthly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(monthlyData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create monthly payment');
      }

      const payment: Payment = await response.json();

      // Refresh payments list
      await mutatePayments();

      toast.success(t('monthly.success'));

      return payment;
    } catch (error) {
      console.error('Failed to create monthly payment:', error);
      toast.error(t('monthly.error'), {
        description:
          error instanceof Error ? error.message : t('errors.tryAgainLater'),
        action: {
          label: t('common.tryAgain'),
          onClick: () => createMonthlyPayment(monthlyData),
        },
      });
      return null;
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // ========================================
  // Delete Payment
  // ========================================

  /**
   * Delete an approved payment (only allowed for 'approved' status)
   *
   * @param paymentId - ID of the payment to delete
   * @returns Promise that resolves when deletion is complete
   */
  const deletePayment = async (paymentId: string): Promise<boolean> => {
    if (!caseId) {
      toast.error(t('errors.invalidCase'));
      return false;
    }

    setIsDeletingPayment(paymentId);

    try {
      const response = await fetch(`/api/cases/${caseId}/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete payment');
      }

      // Refresh payments list
      await mutatePayments();

      toast.success(t('delete.success'));
      return true;
    } catch (error) {
      console.error('Failed to delete payment:', error);
      toast.error(t('delete.error'), {
        description:
          error instanceof Error ? error.message : t('errors.tryAgainLater'),
      });
      return false;
    } finally {
      setIsDeletingPayment(null);
    }
  };

  // ========================================
  // Refresh Functions
  // ========================================

  /**
   * Force refresh payments list from server
   */
  const refreshPayments = async () => {
    try {
      await mutatePayments();
    } catch (error) {
      console.error('Failed to refresh payments:', error);
      toast.error(t('errors.refreshFailed'));
    }
  };

  /**
   * Force refresh bank details from server
   */
  const refreshBankDetails = async () => {
    try {
      await mutateBankDetails();
    } catch (error) {
      console.error('Failed to refresh bank details:', error);
      toast.error(t('errors.refreshFailed'));
    }
  };

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
    isApproving,
    isCreatingPayment,
    isSavingBankDetails,
    isDeletingPayment,
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
