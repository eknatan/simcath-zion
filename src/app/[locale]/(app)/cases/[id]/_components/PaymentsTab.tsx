'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { RefreshCw, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { type BankDetailsFormData } from '@/components/shared/BankDetailsForm';
import { ActionButton } from '@/components/shared/ActionButton';
import { PaymentHistoryTable } from '@/components/shared/PaymentHistoryTable';
import { useCasePayments } from '@/components/features/cases/hooks/useCasePayments';
import { getExchangeRate, getBankOfIsraelRates, type BankOfIsraelRates } from '@/lib/services/currency.service';
import { BankSelector, BranchSelector } from '@/components/features/banks/BankBranchSelector';
import type { CaseWithRelations } from '@/types/case.types';

interface PaymentsTabProps {
  caseData: CaseWithRelations;
}

/**
 * PaymentsTab Component
 *
 * Manages payment processing for wedding cases:
 * 1. Bank account details
 * 2. Wedding cost and donation amounts
 * 3. Currency conversion (USD → ILS)
 * 4. Payment approval
 * 5. Payment history
 *
 * Design: Version B - Elegant & Soft
 */
export function PaymentsTab({ caseData }: PaymentsTabProps) {
  const t = useTranslations('payments');
  const tc = useTranslations('common');

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
    saveBankDetails,
    approvePayment,
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

  // State for bank and branch selection
  const [selectedBankCode, setSelectedBankCode] = useState<string>('');
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('');

  const [weddingCost, setWeddingCost] = useState('');
  const [donationUsd, setDonationUsd] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [donationIls, setDonationIls] = useState('');
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  // Bank of Israel rates state
  const [boiRates, setBoiRates] = useState<BankOfIsraelRates | null>(null);
  const [isLoadingBoiRates, setIsLoadingBoiRates] = useState(false);

  // ========================================
  // Effects
  // ========================================

  // Load bank details when available
  useEffect(() => {
    console.log('[PaymentsTab] Bank details changed:', bankDetails);
    if (bankDetails) {
      console.log('[PaymentsTab] Loading bank details into form:', bankDetails);
      setLocalBankDetails(bankDetails);
      setSelectedBankCode(bankDetails.bank_number || '');
      setSelectedBranchCode(bankDetails.branch || '');
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
   * Handle bank selection
   */
  const handleBankSelect = (bankCode: string) => {
    setSelectedBankCode(bankCode);
    setSelectedBranchCode(''); // Reset branch when bank changes
    setLocalBankDetails({
      ...localBankDetails,
      bank_number: bankCode,
      branch: '', // Reset branch when bank changes
    });
  };

  /**
   * Handle branch selection
   */
  const handleBranchSelect = (branchCode: string) => {
    setSelectedBranchCode(branchCode);
    setLocalBankDetails({
      ...localBankDetails,
      branch: branchCode,
    });
  };

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
   * Fetch Bank of Israel rates (buy/sell/representative)
   */
  const handleFetchBoiRates = async () => {
    setIsLoadingBoiRates(true);
    try {
      const rates = await getBankOfIsraelRates();
      if (rates) {
        setBoiRates(rates);
        toast.success(t('conversion.boiRates.title'));
      } else {
        toast.error(t('conversion.boiRates.fetchError'));
      }
    } catch (error) {
      console.error('Failed to fetch BOI rates:', error);
      toast.error(t('conversion.boiRates.fetchError'));
    } finally {
      setIsLoadingBoiRates(false);
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
  const canApprove = !hasApprovedPayment && isBankDetailsLocked && donationUsd && exchangeRate && donationIls;

  // ========================================
  // Render
  // ========================================

  return (
    <div className="space-y-6">
      {/* Section 1: Bank Account Details - Compact Grid */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-white to-sky-50/30">
          <CardTitle className="text-lg font-medium text-slate-800 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-sky-600" />
            {t('bankDetails.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingBankDetails ? (
            <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              {/* Grid Layout for Bank Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Selector */}
                <div className="space-y-2">
                  <Label htmlFor="bank_number" className="text-slate-700">
                    {t('bankDetails.bank')}
                  </Label>
                  <BankSelector
                    value={selectedBankCode}
                    onValueChange={handleBankSelect}
                    disabled={isBankDetailsLocked}
                    className="border-slate-300"
                  />
                  {bankDetailsErrors.bank_number && (
                    <p className="text-sm text-rose-600">{bankDetailsErrors.bank_number}</p>
                  )}
                </div>

                {/* Branch Selector */}
                <div className="space-y-2">
                  <Label htmlFor="branch" className="text-slate-700">
                    {t('bankDetails.branch')}
                  </Label>
                  <BranchSelector
                    bankCode={selectedBankCode}
                    value={selectedBranchCode}
                    onValueChange={handleBranchSelect}
                    disabled={isBankDetailsLocked}
                    className="border-slate-300"
                  />
                  {bankDetailsErrors.branch && (
                    <p className="text-sm text-rose-600">{bankDetailsErrors.branch}</p>
                  )}
                </div>

                {/* Account Number */}
                <div className="space-y-2">
                  <Label htmlFor="account_number" className="text-slate-700">
                    {t('bankDetails.accountNumber')}
                  </Label>
                  <Input
                    id="account_number"
                    type="text"
                    inputMode="numeric"
                    maxLength={20}
                    value={localBankDetails.account_number}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setLocalBankDetails({ ...localBankDetails, account_number: val });
                    }}
                    placeholder={t('bankDetails.accountNumberPlaceholder')}
                    className="border-slate-300"
                    readOnly={isBankDetailsLocked}
                  />
                  {bankDetailsErrors.account_number && (
                    <p className="text-sm text-rose-600">{bankDetailsErrors.account_number}</p>
                  )}
                </div>

                {/* Account Holder Name */}
                <div className="space-y-2">
                  <Label htmlFor="account_holder_name" className="text-slate-700">
                    {t('bankDetails.accountHolder')}
                  </Label>
                  <Input
                    id="account_holder_name"
                    value={localBankDetails.account_holder_name || ''}
                    onChange={(e) => setLocalBankDetails({ ...localBankDetails, account_holder_name: e.target.value })}
                    placeholder={t('bankDetails.accountHolderPlaceholder')}
                    className="border-slate-300"
                    readOnly={isBankDetailsLocked}
                  />
                  {bankDetailsErrors.account_holder_name && (
                    <p className="text-sm text-rose-600">{bankDetailsErrors.account_holder_name}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {!isBankDetailsLocked ? (
                  <ActionButton
                    variant="primary"
                    onClick={handleSaveBankDetails}
                    disabled={isSavingBankDetails}
                  >
                    {isSavingBankDetails ? tc('saving') : t('bankDetails.save')}
                  </ActionButton>
                ) : (
                  <ActionButton
                    variant="cancel"
                    onClick={handleUnlockBankDetails}
                  >
                    {t('bankDetails.edit')}
                  </ActionButton>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Payment Details - Combined Compact Layout */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-white to-emerald-50/30">
          <CardTitle className="text-lg font-medium text-slate-800">
            {t('costAndDonation.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Bank of Israel Rates Display */}
          <div className="mb-6 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-900">
                {t('conversion.boiRates.title')}
              </h3>
              <ActionButton
                variant="cancel"
                onClick={handleFetchBoiRates}
                disabled={isLoadingBoiRates}
                className="shrink-0 h-8 text-xs"
              >
                <RefreshCw className={cn("h-3 w-3 ml-2", isLoadingBoiRates && "animate-spin")} />
                {t('conversion.boiRates.refresh')}
              </ActionButton>
            </div>

            {isLoadingBoiRates ? (
              <div className="text-sm text-blue-600">{t('conversion.boiRates.loading')}</div>
            ) : boiRates ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Representative Rate */}
                <div className="bg-white p-3 rounded border border-blue-100">
                  <div className="text-xs text-slate-600 mb-1">
                    {t('conversion.boiRates.representative')}
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    ₪{boiRates.representative.toFixed(4)}
                  </div>
                </div>

                {/* Buy Rate */}
                <div className="bg-white p-3 rounded border border-green-100">
                  <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                    {t('conversion.boiRates.buy')}
                    <span className="text-xs text-slate-400" title={t('conversion.boiRates.buyTooltip')}>ⓘ</span>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    ₪{boiRates.buy.toFixed(4)}
                  </div>
                </div>

                {/* Sell Rate */}
                <div className="bg-white p-3 rounded border border-orange-100">
                  <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                    {t('conversion.boiRates.sell')}
                    <span className="text-xs text-slate-400" title={t('conversion.boiRates.sellTooltip')}>ⓘ</span>
                  </div>
                  <div className="text-lg font-bold text-orange-700">
                    ₪{boiRates.sell.toFixed(4)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                לחץ על &quot;{t('conversion.boiRates.refresh')}&quot; לקבלת שערי בנק ישראל העדכניים
              </div>
            )}
          </div>

          {/* Top Row: Wedding Cost, Donation, Exchange Rate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Wedding Cost */}
            <div className="space-y-2">
              <Label htmlFor="weddingCost" className="text-slate-700">
                {t('costAndDonation.weddingCost')}
              </Label>
              <Input
                id="weddingCost"
                type="number"
                value={weddingCost}
                onChange={(e) => setWeddingCost(e.target.value)}
                placeholder={t('costAndDonation.weddingCostPlaceholder')}
                className="border-slate-300"
              />
            </div>

            {/* Donation USD */}
            <div className="space-y-2">
              <Label htmlFor="donationUsd" className="text-slate-700">
                {t('costAndDonation.donationUsd')} *
              </Label>
              <Input
                id="donationUsd"
                type="number"
                value={donationUsd}
                onChange={(e) => setDonationUsd(e.target.value)}
                placeholder={t('costAndDonation.donationUsdPlaceholder')}
                className="border-slate-300"
              />
            </div>

            {/* Exchange Rate */}
            <div className="space-y-2">
              <Label htmlFor="exchangeRate" className="text-slate-700">
                {t('conversion.exchangeRate')} *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.0001"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder={t('conversion.exchangeRatePlaceholder')}
                  className="border-slate-300"
                />
                <ActionButton
                  variant="cancel"
                  onClick={handleFetchExchangeRate}
                  disabled={isLoadingRate}
                  className="shrink-0 whitespace-nowrap"
                  aria-label={t('conversion.updateRateFromBOI')}
                  title={t('conversion.updateRateFromBOI')}
                >
                  <RefreshCw className={cn("h-4 w-4 ml-1", isLoadingRate && "animate-spin")} />
                  <span className="hidden lg:inline">{t('conversion.updateRate')}</span>
                </ActionButton>
              </div>
            </div>
          </div>

          {/* Bottom Row: Calculated ILS Amount - Highlighted */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg">
            <Label htmlFor="donationIls" className="text-emerald-900 text-sm mb-2 block">
              {t('conversion.amountIls')}
            </Label>
            <div className="text-2xl font-bold text-emerald-700">
              {donationIls ? `₪${parseFloat(donationIls).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t('conversion.amountIlsPlaceholder')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Approval */}
      {!hasApprovedPayment && (
        <Card className="border-sky-200 shadow-sm">
          <CardHeader className="border-b border-sky-100 bg-gradient-to-br from-white to-sky-50/30">
            <CardTitle className="text-lg font-medium text-sky-800">
              {t('approval.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Summary */}
            <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t('approval.donationAmount')}</span>
                <span className="font-semibold text-slate-900">
                  {donationUsd ? `$${parseFloat(donationUsd).toLocaleString('en-US')}` : '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t('approval.exchangeRate')}</span>
                <span className="font-semibold text-slate-900">
                  {exchangeRate || '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t('approval.transferAmount')}</span>
                <span className="font-semibold text-emerald-600 text-base">
                  {donationIls ? `₪${parseFloat(donationIls).toLocaleString('he-IL', { minimumFractionDigits: 2 })}` : '-'}
                </span>
              </div>
              {bankDetails && (
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-600">{t('approval.accountHolder')}</span>
                  <span className="font-semibold text-slate-900">
                    {bankDetails.account_holder_name}
                  </span>
                </div>
              )}
            </div>

            {/* Approve Button */}
            <ActionButton
              variant="primary"
              onClick={() => setShowApprovalDialog(true)}
              disabled={!canApprove}
              className="w-full"
            >
              {t('approval.approveButton')}
            </ActionButton>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Payment History */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg font-medium text-slate-800">
            {t('history.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <PaymentHistoryTable
            payments={payments || []}
            isLoading={isLoadingPayments}
          />
        </CardContent>
      </Card>

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('approval.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('approval.confirmMessage', {
                amount: donationIls ? `₪${parseFloat(donationIls).toLocaleString('he-IL')}` : '',
                account: bankDetails?.account_holder_name || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprovePayment}
              disabled={isApproving}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {isApproving ? tc('saving') : t('approval.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
