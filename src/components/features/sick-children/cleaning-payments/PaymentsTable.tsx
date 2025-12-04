'use client';

import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/utils/format';
import type { PaymentsTableProps } from './types';

/**
 * PaymentsTable - Displays payment history in a table
 *
 * Single Responsibility: Only displays data, doesn't manage state.
 * Actions are delegated to parent via callbacks.
 */
export function PaymentsTable({
  payments,
  isLoading,
  onEdit,
  onDelete,
  formatPaymentMonth,
}: PaymentsTableProps) {
  const t = useTranslations('sickChildren.payments');
  const tCommon = useTranslations('common');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500">
        {t('noPayments')}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>{t('month')}</TableHead>
            <TableHead>{t('amount')}</TableHead>
            <TableHead>{t('entryDate')}</TableHead>
            <TableHead>{tCommon('status')}</TableHead>
            <TableHead className="text-left">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                {payment.payment_month ? formatPaymentMonth(payment.payment_month) : '-'}
              </TableCell>
              <TableCell>
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(payment.amount_ils)}
                </span>
              </TableCell>
              <TableCell className="text-slate-600">
                {payment.created_at
                  ? new Date(payment.created_at).toLocaleDateString('he-IL')
                  : '-'}
              </TableCell>
              <TableCell>
                <StatusBadge status={payment.status as 'pending' | 'approved' | 'transferred' | 'rejected'} />
              </TableCell>
              <TableCell>
                {payment.status !== 'transferred' && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-slate-700"
                      onClick={() => onEdit(payment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:text-rose-700"
                      onClick={() => onDelete(payment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
