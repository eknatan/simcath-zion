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

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Payment } from '@/types/case.types';
import {
  formatPaymentDate,
  formatILS,
  formatUSD,
  getPaymentStatusVariant,
  getPaymentStatusLabel,
} from '@/lib/utils/payment-format';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
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
import { DataTable } from '@/components/shared/DataTable/DataTable';

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
  // Columns Definition
  // ========================================

  const columns = useMemo<ColumnDef<Payment>[]>(() => {
    const cols: ColumnDef<Payment>[] = [
      {
        accessorKey: 'created_at',
        header: t('headers.date'),
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">
            {formatPaymentDate(row.original.created_at)}
          </span>
        ),
      },
      {
        accessorKey: 'amount_usd',
        header: t('headers.amountUSD'),
        cell: ({ row }) => (
          <span className="text-slate-700 font-semibold">
            {formatUSD(row.original.amount_usd)}
          </span>
        ),
      },
      {
        accessorKey: 'amount_ils',
        header: t('headers.amountILS'),
        cell: ({ row }) => (
          <span className="text-slate-700 font-semibold">
            {formatILS(row.original.amount_ils)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('headers.status'),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={getPaymentStatusVariant(row.original.status)}
          >
            {getPaymentStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'notes',
        header: t('headers.notes'),
        cell: ({ row }) => (
          <span className="text-slate-600 text-sm max-w-xs truncate block">
            {row.original.notes || '-'}
          </span>
        ),
      },
    ];

    if (onDelete) {
      cols.push({
        id: 'actions',
        header: t('headers.actions'),
        cell: ({ row }) => {
          if (row.original.status !== 'approved') return null;

          return (
            <ActionButton
              variant="cancel"
              onClick={() => setPaymentToDelete(row.original)}
              disabled={deletingPaymentId === row.original.id}
              className="h-8 w-8 p-0"
              title="מחק תשלום"
            >
              <Trash2 className="h-4 w-4" />
            </ActionButton>
          );
        },
      });
    }

    return cols;
  }, [t, onDelete, deletingPaymentId]);

  // ========================================
  // Render
  // ========================================

  return (
    <>
      <div className={`border border-slate-200 rounded-lg shadow-md overflow-hidden ${className}`}>
        <DataTable
          columns={columns}
          data={payments}
          isLoading={isLoading}
        />
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
    </>
  );
}
