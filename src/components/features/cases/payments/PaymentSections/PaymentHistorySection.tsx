'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentHistoryTable } from '@/components/shared/PaymentHistoryTable';
import { useTranslations } from 'next-intl';
import { Payment } from '@/types/case.types';

interface PaymentHistorySectionProps {
  payments: Payment[];
  isLoading: boolean;
  onDelete: (paymentId: string) => Promise<boolean>;
  deletingPaymentId: string | null;
}

export function PaymentHistorySection({
  payments,
  isLoading,
  onDelete,
  deletingPaymentId
}: PaymentHistorySectionProps) {
  const t = useTranslations('payments');

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-lg font-medium text-slate-800">
          {t('history.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <PaymentHistoryTable
          payments={payments || []}
          isLoading={isLoading}
          onDelete={onDelete}
          deletingPaymentId={deletingPaymentId}
        />
      </CardContent>
    </Card>
  );
}