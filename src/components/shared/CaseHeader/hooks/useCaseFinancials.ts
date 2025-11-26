import { CaseWithRelations, PaymentStatus } from '@/types/case.types';

interface WeddingFinancials {
  requestedAmount: number | null;
  approvedAmount: number | null;
  hasApprovedPayment: boolean;
}

interface CleaningFinancials {
  totalTransferred: number;
  activeMonths: number;
  hasPendingPayments: boolean;
  pendingPaymentInfo?: {
    month: string;
    amount: number;
  };
}

export function useWeddingFinancials(caseData: CaseWithRelations): WeddingFinancials {
  const approvedPayment = caseData.payments?.find(
    p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.TRANSFERRED
  );

  return {
    requestedAmount: caseData.total_cost || null,
    approvedAmount: approvedPayment?.amount_ils || null,
    hasApprovedPayment: !!approvedPayment,
  };
}

export function useCleaningFinancials(caseData: CaseWithRelations): CleaningFinancials {
  const pendingPayments = caseData.payments?.filter(p => p.status === 'pending') || [];
  const hasPendingPayments = pendingPayments.length > 0;

  const pendingPaymentInfo = hasPendingPayments && pendingPayments[0]?.payment_month
    ? {
        month: new Date(pendingPayments[0].payment_month).toLocaleDateString('he-IL', {
          month: 'long',
          year: 'numeric',
        }),
        amount: pendingPayments[0].amount_ils || 0,
      }
    : undefined;

  const totalTransferred = caseData.payments?.reduce(
    (sum, payment) => sum + payment.amount_ils,
    0
  ) || 0;

  const activeMonths = caseData.payments?.length || 0;

  return {
    totalTransferred,
    activeMonths,
    hasPendingPayments,
    pendingPaymentInfo,
  };
}
