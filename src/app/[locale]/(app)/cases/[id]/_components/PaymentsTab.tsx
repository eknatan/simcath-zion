'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useCasePayments } from '@/components/features/cases/hooks/useCasePayments';
import type { BankDetailsFormData } from '@/components/shared/BankDetailsForm';
import type { CaseWithRelations } from '@/types/case.types';

// Import the new extracted components
import { ApprovedPaymentBanner } from '@/components/features/cases/payments/PaymentSections/ApprovedPaymentBanner';
import { BankDetailsSection } from '@/components/features/cases/payments/PaymentSections/BankDetailsSection';
import { PaymentCalculationSection } from '@/components/features/cases/payments/PaymentSections/PaymentCalculationSection';
import { PaymentApprovalSection } from '@/components/features/cases/payments/PaymentSections/PaymentApprovalSection';
import { PaymentHistorySection } from '@/components/features/cases/payments/PaymentSections/PaymentHistorySection';
import { PaymentApprovalDialog } from '@/components/features/cases/payments/PaymentDialogs/PaymentApprovalDialog';

interface PaymentsTabProps {
  caseData: CaseWithRelations;
}

/**
 * PaymentsTab Component (Refactored)
 *
 * Manages payment processing for wedding cases:
 * 1. Bank account details
 * 2. Wedding cost and donation amounts
 * 3. Currency conversion (USD → ILS)
 * 4. Payment approval
 * 5. Payment history
 *
 * Design: Version B - Elegant & Soft
 * Refactored into smaller, focused components
 */
export function PaymentsTab({ caseData }: PaymentsTabProps) {
  const t = useTranslations('payments');

  // ========================================
  // Hooks
  // ========================================
  const {
    payments,
    bankDetails,
    isLoadingPayments,
    isLoadingBankDetails,
    isApproving,
    isSavingBankDetails,
    isDeletingPayment,
    saveBankDetails,
    approvePayment,
    deletePayment,
    refreshPayments,
    refreshBankDetails,
  } = useCasePayments(caseData.id);

  // ========================================
  // Local State
  // ========================================
  const [localBankDetails, setLocalBankDetails] = useState<BankDetailsFormData>({
    bank_number: '',
    branch: '',
    account_number: '',
    account_holder_name: '',
  });
  const [bankDetailsErrors, setBankDetailsErrors] = useState<Record<string, string>>({});
  const [isBankDetailsLocked, setIsBankDetailsLocked] = useState(false);

  const [weddingCost, setWeddingCost] = useState('');
  const [donationUsd, setDonationUsd] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [donationIls, setDonationIls] = useState('');
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  // ========================================
  // Effects
  // ========================================

  // Load bank details when available
  useEffect(() => {
    console.log('[PaymentsTab] Bank details changed:', bankDetails);
    if (bankDetails) {
      console.log('[PaymentsTab] Loading bank details into form:', bankDetails);
      setLocalBankDetails(bankDetails);
      setIsBankDetailsLocked(true);
    } else {
      console.log('[PaymentsTab] No bank details found - form will be empty');
    }
  }, [bankDetails]);

  // Load wedding cost from case data
  useEffect(() => {
    if (caseData.total_cost) {
      setWeddingCost(caseData.total_cost.toString());
    }
  }, [caseData.total_cost]);

  // Auto-calculate ILS amount when USD or rate changes
  useEffect(() => {
    if (donationUsd && exchangeRate) {
      const usd = parseFloat(donationUsd);
      const rate = parseFloat(exchangeRate);
      if (!isNaN(usd) && !isNaN(rate)) {
        const ils = usd * rate;
        setDonationIls(ils.toFixed(2));
      }
    } else {
      setDonationIls('');
    }
  }, [donationUsd, exchangeRate]);

  // ========================================
  // Handlers
  // ========================================

  /**
   * Validate bank details form
   */
  const validateBankDetails = (): boolean => {
    const errors: Record<string, string> = {};

    if (!localBankDetails.bank_number) {
      errors.bank_number = t('bankDetails.errors.bankRequired');
    }

    if (!localBankDetails.branch) {
      errors.branch = t('bankDetails.errors.branchRequired');
    } else if (!/^\d{3}$/.test(localBankDetails.branch)) {
      errors.branch = t('bankDetails.errors.branchFormat');
    }

    if (!localBankDetails.account_number) {
      errors.account_number = t('bankDetails.errors.accountRequired');
    } else if (!/^\d{2,20}$/.test(localBankDetails.account_number)) {
      errors.account_number = t('bankDetails.errors.accountFormat');
    }

    if (!localBankDetails.account_holder_name?.trim()) {
      errors.account_holder_name = t('bankDetails.errors.holderRequired');
    }

    setBankDetailsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle bank details save
   */
  const handleSaveBankDetails = async () => {
    console.log('[PaymentsTab] Attempting to save bank details:', localBankDetails);

    if (!validateBankDetails()) {
      console.log('[PaymentsTab] Validation failed');
      toast.error(t('errors.validationFailed'));
      return;
    }

    console.log('[PaymentsTab] Validation passed, calling saveBankDetails');
    try {
      await saveBankDetails(localBankDetails);
      console.log('[PaymentsTab] Save completed successfully');
      setIsBankDetailsLocked(true);
      toast.success(t('bankDetails.saveSuccess'));
    } catch (error) {
      console.error('[PaymentsTab] Failed to save bank details:', error);
      toast.error(t('errors.saveBankDetails'));
    }
  };

  /**
   * Unlock bank details for editing
   */
  const handleUnlockBankDetails = () => {
    setIsBankDetailsLocked(false);
    // Keep the current selections when unlocking
  };

  /**
   * Fetch current exchange rate
   */
  const handleFetchExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const { getExchangeRate } = await import('@/lib/services/currency.service');
      const { rate, source } = await getExchangeRate();
      setExchangeRate(rate.toFixed(4));
      toast.success(
        `${t('conversion.rateUpdated')}: ${rate.toFixed(4)} (${source === 'boi' ? 'בנק ישראל' : 'ExchangeRate-API'})`
      );
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      toast.error(t('errors.fetchRate'));
    } finally {
      setIsLoadingRate(false);
    }
  };

  /**
   * Validate payment approval
   */
  const validatePaymentApproval = (): boolean => {
    if (!bankDetails) {
      toast.error(t('errors.noBankDetails'));
      return false;
    }

    if (!donationUsd || parseFloat(donationUsd) <= 0) {
      toast.error(t('errors.invalidAmount'));
      return false;
    }

    if (!exchangeRate || parseFloat(exchangeRate) <= 0) {
      toast.error(t('errors.invalidRate'));
      return false;
    }

    if (!donationIls || parseFloat(donationIls) <= 0) {
      toast.error(t('errors.invalidIlsAmount'));
      return false;
    }

    return true;
  };

  /**
   * Handle payment approval
   */
  const handleApprovePayment = async () => {
    if (!validatePaymentApproval()) {
      return;
    }

    try {
      await approvePayment({
        amount_usd: parseFloat(donationUsd),
        amount_ils: parseFloat(donationIls),
        exchange_rate: parseFloat(exchangeRate),
      });

      toast.success(t('approval.success'));
      setShowApprovalDialog(false);

      // Refresh data
      refreshPayments();
      refreshBankDetails();

      // Clear form
      setWeddingCost('');
      setDonationUsd('');
      setExchangeRate('');
      setDonationIls('');
    } catch (error) {
      console.error('Failed to approve payment:', error);
      toast.error(t('errors.approvePayment'));
    }
  };

  // ========================================
  // Computed Values
  // ========================================
  const hasApprovedPayment = payments?.some(p => p.status === 'approved') ?? false;
  const canApprove = Boolean(!hasApprovedPayment && isBankDetailsLocked && donationUsd && exchangeRate && donationIls);

  // ========================================
  // Render
  // ========================================

  return (
    <div className="space-y-6">
      {/* Approved Payment Pending Banner */}
      {hasApprovedPayment && (
        <ApprovedPaymentBanner
          payments={payments || []}
          isDeletingPayment={isDeletingPayment}
          onDeletePayment={deletePayment}
        />
      )}

      {/* Section 1: Bank Account Details */}
      <BankDetailsSection
        bankDetails={bankDetails}
        localBankDetails={localBankDetails}
        bankDetailsErrors={bankDetailsErrors}
        isBankDetailsLocked={isBankDetailsLocked}
        isLoadingBankDetails={isLoadingBankDetails}
        isSavingBankDetails={isSavingBankDetails}
        onLocalBankDetailsChange={setLocalBankDetails}
        onSave={handleSaveBankDetails}
        onUnlock={handleUnlockBankDetails}
      />

      {/* Section 2: Payment Details */}
      <PaymentCalculationSection
        weddingCost={weddingCost}
        donationUsd={donationUsd}
        exchangeRate={exchangeRate}
        donationIls={donationIls}
        isLoadingRate={isLoadingRate}
        onWeddingCostChange={setWeddingCost}
        onDonationUsdChange={setDonationUsd}
        onExchangeRateChange={setExchangeRate}
        onFetchExchangeRate={handleFetchExchangeRate}
      />

      {/* Section 3: Approval */}
      {!hasApprovedPayment && (
        <PaymentApprovalSection
          donationUsd={donationUsd}
          exchangeRate={exchangeRate}
          donationIls={donationIls}
          bankDetails={bankDetails}
          canApprove={canApprove}
          onApprove={() => setShowApprovalDialog(true)}
        />
      )}

      {/* Section 4: Payment History */}
      <PaymentHistorySection
        payments={payments || []}
        isLoading={isLoadingPayments}
        onDelete={deletePayment}
        deletingPaymentId={isDeletingPayment}
      />

      {/* Approval Confirmation Dialog */}
      <PaymentApprovalDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        onConfirm={handleApprovePayment}
        isApproving={isApproving}
        donationIls={donationIls}
        bankDetails={bankDetails}
      />
    </div>
  );
}