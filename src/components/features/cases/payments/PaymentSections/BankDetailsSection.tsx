'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ActionButton } from '@/components/shared/ActionButton';
import { DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BankSelector, BranchSelector } from '@/components/features/banks/BankBranchSelector';
import type { BankDetailsFormData } from '@/components/shared/BankDetailsForm';

interface BankDetailsSectionProps {
  bankDetails: BankDetailsFormData | null;
  localBankDetails: BankDetailsFormData;
  bankDetailsErrors: Record<string, string>;
  isBankDetailsLocked: boolean;
  isLoadingBankDetails: boolean;
  isSavingBankDetails: boolean;
  selectedBankCode: string;
  selectedBranchCode: string;
  onBankSelect: (bankCode: string) => void;
  onBranchSelect: (branchCode: string) => void;
  onLocalBankDetailsChange: (details: BankDetailsFormData) => void;
  onSave: () => void;
  onUnlock: () => void;
}

export function BankDetailsSection({
  bankDetails,
  localBankDetails,
  bankDetailsErrors,
  isBankDetailsLocked,
  isLoadingBankDetails,
  isSavingBankDetails,
  selectedBankCode,
  selectedBranchCode,
  onBankSelect,
  onBranchSelect,
  onLocalBankDetailsChange,
  onSave,
  onUnlock
}: BankDetailsSectionProps) {
  const t = useTranslations('payments');

  return (
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
                  onValueChange={onBankSelect}
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
                  onValueChange={onBranchSelect}
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
                    onLocalBankDetailsChange({ ...localBankDetails, account_number: val });
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
                  onChange={(e) => onLocalBankDetailsChange({ ...localBankDetails, account_holder_name: e.target.value })}
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
                  onClick={onSave}
                  disabled={isSavingBankDetails}
                >
                  {isSavingBankDetails ? t('common.saving') : t('bankDetails.save')}
                </ActionButton>
              ) : (
                <ActionButton
                  variant="cancel"
                  onClick={onUnlock}
                >
                  {t('bankDetails.edit')}
                </ActionButton>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}