'use client';

/**
 * PaymentHistoryTable Component
 *
 * Displays a table of payment history for a case
 *
 * Features:
 * - Displays payment date, USD amount, ILS amount, status, and notes
 * - Formatted currency and dates
 * - Colored status badges following Design Version B (Elegant & Soft)
 * - Responsive design
 * - Empty state
 *
 * Design: Version B - Elegant & Soft
 * - Soft colors: emerald, sky, rose, slate
 * - Thin borders
 * - Minimal shadows
 * - No glossy effects
 *
 * @example
 * ```tsx
 * <PaymentHistoryTable
 *   payments={casePayments}
 *   isLoading={false}
 * />
 * ```
 */

import { Payment } from '@/types/case.types';
import {
  formatPaymentDate,
  formatILS,
  formatUSD,
  getPaymentStatusVariant,
  getPaymentStatusLabel,
} from '@/lib/utils/payment-format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Receipt } from 'lucide-react';

// ========================================
// Types
// ========================================

export interface PaymentHistoryTableProps {
  /**
   * Array of payments to display
   */
  payments: Payment[];

  /**
   * Whether the data is currently loading
   */
  isLoading?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;
}

// ========================================
// Component
// ========================================

export function PaymentHistoryTable({
  payments,
  isLoading = false,
  className = '',
}: PaymentHistoryTableProps) {
  // ========================================
  // Loading State
  // ========================================

  if (isLoading) {
    return (
      <div className={`border border-slate-200 rounded-lg p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
          <p className="ms-3 text-slate-600">טוען היסטוריית תשלומים...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // Empty State
  // ========================================

  if (!payments || payments.length === 0) {
    return (
      <div className={`border border-slate-200 rounded-lg p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center text-center">
          <Receipt className="h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">
            אין תשלומים
          </h3>
          <p className="text-sm text-slate-500">
            טרם בוצעו תשלומים בתיק זה
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // Table Render
  // ========================================

  return (
    <div className={`border border-slate-200 rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-200">
              <TableHead className="text-right font-semibold text-slate-700">
                תאריך
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                סכום ($)
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                סכום (₪)
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                סטטוס
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                הערות
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow
                key={payment.id}
                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
              >
                {/* Date */}
                <TableCell className="font-medium text-slate-900">
                  {formatPaymentDate(payment.created_at)}
                </TableCell>

                {/* USD Amount */}
                <TableCell className="text-slate-700 font-semibold">
                  {formatUSD(payment.amount_usd)}
                </TableCell>

                {/* ILS Amount */}
                <TableCell className="text-slate-700 font-semibold">
                  {formatILS(payment.amount_ils)}
                </TableCell>

                {/* Status Badge */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getPaymentStatusVariant(payment.status)}
                  >
                    {getPaymentStatusLabel(payment.status)}
                  </Badge>
                </TableCell>

                {/* Notes */}
                <TableCell className="text-slate-600 text-sm max-w-xs truncate">
                  {payment.notes || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-200">
        {payments.map((payment) => (
          <div key={payment.id} className="p-4 space-y-3">
            {/* Header: Date and Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">
                {formatPaymentDate(payment.created_at)}
              </span>
              <Badge
                variant="outline"
                className={getPaymentStatusVariant(payment.status)}
              >
                {getPaymentStatusLabel(payment.status)}
              </Badge>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-500 block mb-1">סכום ($)</span>
                <span className="text-base font-semibold text-slate-700">
                  {formatUSD(payment.amount_usd)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">סכום (₪)</span>
                <span className="text-base font-semibold text-slate-700">
                  {formatILS(payment.amount_ils)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {payment.notes && (
              <div>
                <span className="text-xs text-slate-500 block mb-1">הערות</span>
                <p className="text-sm text-slate-600">{payment.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
