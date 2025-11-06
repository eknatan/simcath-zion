'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionButton } from '@/components/shared/ActionButton';
import { useTranslations } from 'next-intl';
import type { BankDetailsFormData } from '@/types/case.types';

interface PaymentApprovalSectionProps {
  donationUsd: string;
  exchangeRate: string;
  donationIls: string;
  bankDetails: BankDetailsFormData | null;
  canApprove: boolean;
  onApprove: () => void;
}

export function PaymentApprovalSection({
  donationUsd,
  exchangeRate,
  donationIls,
  bankDetails,
  canApprove,
  onApprove
}: PaymentApprovalSectionProps) {
  const t = useTranslations('payments');

  return (
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
          onClick={onApprove}
          disabled={!canApprove}
          className="w-full"
        >
          {t('approval.approveButton')}
        </ActionButton>
      </CardContent>
    </Card>
  );
}