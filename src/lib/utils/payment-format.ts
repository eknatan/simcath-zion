/**
 * Payment formatting utilities
 * Handles date, currency, and status formatting for payment displays
 */

import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { PaymentStatus } from '@/types/case.types';

/**
 * Format a date for payment history display
 * @param dateString - ISO date string
 * @returns Formatted date in Hebrew locale (dd/MM/yy)
 */
export function formatPaymentDate(dateString: string | null): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yy', { locale: he });
  } catch {
    return '-';
  }
}

/**
 * Format currency amount in ILS
 * @param amount - Amount in ILS
 * @returns Formatted string with ₪ symbol and thousands separator
 */
export function formatILS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';

  return `₪${amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format currency amount in USD
 * @param amount - Amount in USD
 * @returns Formatted string with $ symbol and thousands separator
 */
export function formatUSD(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';

  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Get the Tailwind CSS classes for a payment status badge
 * Following Design Version B - Elegant & Soft
 * @param status - Payment status
 * @returns CSS class string for badge styling
 */
export function getPaymentStatusVariant(
  status: PaymentStatus | string
): string {
  switch (status) {
    case PaymentStatus.PENDING:
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200';

    case PaymentStatus.APPROVED:
    case 'approved':
      return 'bg-sky-100 text-sky-700 border-sky-200';

    case PaymentStatus.TRANSFERRED:
    case 'transferred':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';

    case PaymentStatus.REJECTED:
    case 'rejected':
      return 'bg-rose-100 text-rose-700 border-rose-200';

    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

/**
 * Get the display label for a payment status
 * @param status - Payment status
 * @returns Hebrew label for the status
 */
export function getPaymentStatusLabel(
  status: PaymentStatus | string
): string {
  switch (status) {
    case PaymentStatus.PENDING:
    case 'pending':
      return 'ממתין';

    case PaymentStatus.APPROVED:
    case 'approved':
      return 'אושר';

    case PaymentStatus.TRANSFERRED:
    case 'transferred':
      return 'הועבר';

    case PaymentStatus.REJECTED:
    case 'rejected':
      return 'נדחה';

    default:
      return status;
  }
}
