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

import { useState } from 'react';
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
import { Receipt, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { ActionButton } from '@/components/shared/ActionButton';

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

  /**
   * Callback when payment should be deleted
   */
  onDelete?: (paymentId: string) => Promise<boolean>;

  /**
   * ID of payment currently being deleted
   */
  deletingPaymentId?: string | null;
}

// ========================================
// Component
// ========================================

export function PaymentHistoryTable({
  payments,
  isLoading = false,
  className = '',
  onDelete,
  deletingPaymentId,
}: PaymentHistoryTableProps) {
  const t = useTranslations('paymentHistory');

  // ========================================
  // State
  // ========================================
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // ========================================
  // Handlers
  // ========================================

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = async () => {
    if (paymentToDelete && onDelete) {
      await onDelete(paymentToDelete.id);
      setPaymentToDelete(null);
    }
  };

  // ========================================
  // Loading State
  // ========================================

  if (isLoading) {
    return (
      <div className={`border border-slate-200 rounded-lg p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
          <p className="ms-3 text-slate-600">{t('loading')}</p>
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
            {t('noData')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('noDataDescription')}
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
                {t('headers.date')}
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                {t('headers.amountUSD')}
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                {t('headers.amountILS')}
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                {t('headers.status')}
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                {t('headers.notes')}
              </TableHead>
              {onDelete && (
                <TableHead className="text-right font-semibold text-slate-700">
                  {t('headers.actions')}
                </TableHead>
              )}
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

                {/* Actions */}
                {onDelete && (
                  <TableCell>
                    {payment.status === 'approved' && (
                      <ActionButton
                        variant="cancel"
                        onClick={() => setPaymentToDelete(payment)}
                        disabled={deletingPaymentId === payment.id}
                        className="h-8 w-8 p-0"
                        title="מחק תשלום"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ActionButton>
                    )}
                  </TableCell>
                )}
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

            {/* Actions */}
            {onDelete && payment.status === 'approved' && (
              <div className="pt-2 border-t border-slate-100">
                <ActionButton
                  variant="cancel"
                  onClick={() => setPaymentToDelete(payment)}
                  disabled={deletingPaymentId === payment.id}
                  className="w-full h-9 text-sm"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק תשלום
                </ActionButton>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת תשלום</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את התשלום?
              <div className="mt-3 p-3 bg-slate-50 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">סכום:</span>
                  <span className="font-semibold">
                    {paymentToDelete && `$${paymentToDelete.amount_usd} (₪${paymentToDelete.amount_ils})`}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-rose-600 text-sm font-medium">
                פעולה זו לא ניתנת לביטול.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
