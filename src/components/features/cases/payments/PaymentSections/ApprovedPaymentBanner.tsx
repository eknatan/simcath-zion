'use client';

import { AlertCircle, Trash2 } from 'lucide-react';
import { ActionButton } from '@/components/shared/ActionButton';
import { Payment } from '@/types/case.types';

interface ApprovedPaymentBannerProps {
  payments: Payment[];
  isDeletingPayment: string | null;
  onDeletePayment: (paymentId: string) => Promise<boolean>;
}

export function ApprovedPaymentBanner({
  payments,
  isDeletingPayment,
  onDeletePayment
}: ApprovedPaymentBannerProps) {
  const approvedPayments = payments?.filter((p) => p.status === 'approved') || [];

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">
            תשלום מאושר וממתין להעברה
          </h3>
          <div className="space-y-2">
            {approvedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">סכום:</span>
                    <span className="font-bold text-lg text-slate-900">
                      ${payment.amount_usd?.toLocaleString('en-US') || '0'} = ₪
                      {payment.amount_ils.toLocaleString('he-IL', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">שער:</span>
                    <span className="text-sm font-medium text-slate-700">
                      {payment.exchange_rate}
                    </span>
                  </div>
                </div>
                <ActionButton
                  variant="cancel"
                  onClick={async () => {
                    await onDeletePayment(payment.id);
                  }}
                  disabled={isDeletingPayment === payment.id}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  {isDeletingPayment === payment.id ? 'מוחק...' : 'מחק'}
                </ActionButton>
              </div>
            ))}
          </div>
          <p className="text-sm text-amber-700 mt-3">
            השדות למטה ריקים מכיוון שיש תשלום מאושר קיים. במידה ותרצה ליצור תשלום חדש,
            מחק את התשלום הקיים תחילה.
          </p>
        </div>
      </div>
    </div>
  );
}