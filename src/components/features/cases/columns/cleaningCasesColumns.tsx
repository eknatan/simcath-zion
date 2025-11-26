'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Users, Calendar, DollarSign, CalendarX } from 'lucide-react';
import { Case, Payment } from '@/types/case.types';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { formatMonthYear, isAfter15thOfMonth } from '@/lib/utils/date';
import { createCaseNumberColumn, createCityColumn } from './sharedColumns';

// ========================================
// Types
// ========================================

export interface CleaningCaseWithPayment extends Case {
  current_month_payment?: Payment | null;
}

export interface CleaningColumnsTranslations {
  caseNumber: string;
  familyName: string;
  city: string;
  startDate: string;
  currentMonthPayment: string;
  paymentStatus: string;
  status: string;
  missingPayment: string;
  noPayment: string;
  // Inactive-specific
  endDate?: string;
  endReason?: string;
  reasons?: {
    healed: string;
    deceased: string;
    other: string;
  };
}

// ========================================
// Helper Functions
// ========================================

/**
 * Check if row should be highlighted (after 15th and no payment)
 */
export function shouldHighlightRow(caseItem: CleaningCaseWithPayment): boolean {
  const isAfter15 = isAfter15thOfMonth();
  const hasPayment = !!caseItem.current_month_payment;
  return isAfter15 && !hasPayment;
}

// ========================================
// Column Creators
// ========================================

/**
 * Creates family name column with child name
 */
function createFamilyNameColumn(
  header: string
): ColumnDef<CleaningCaseWithPayment> {
  return {
    accessorKey: 'family_name',
    header,
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-slate-900">{row.original.family_name}</div>
        {row.original.child_name && (
          <div className="text-sm text-slate-600 flex items-center gap-1 mt-0.5">
            <Users className="h-3 w-3" />
            {row.original.child_name}
          </div>
        )}
      </div>
    ),
  };
}

/**
 * Creates start date column
 */
function createStartDateColumn(
  header: string
): ColumnDef<CleaningCaseWithPayment> {
  return {
    accessorKey: 'start_date',
    header,
    cell: ({ row }) => {
      if (row.original.start_date) {
        return (
          <div className="text-sm text-slate-700 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatMonthYear(row.original.start_date)}
          </div>
        );
      }
      return <div className="text-slate-500">-</div>;
    },
  };
}

/**
 * Creates current month payment column
 */
function createPaymentAmountColumn(
  header: string
): ColumnDef<CleaningCaseWithPayment> {
  return {
    accessorKey: 'current_month_payment',
    header,
    cell: ({ row }) => {
      const payment = row.original.current_month_payment;
      if (payment) {
        return (
          <div className="flex items-center gap-2">
            <div className="font-semibold text-emerald-700 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(payment.amount_ils)}
            </div>
          </div>
        );
      }
      return <div className="text-slate-500">-</div>;
    },
  };
}

/**
 * Creates payment status column with missing payment warning
 */
function createPaymentStatusColumn(
  header: string,
  missingPaymentLabel: string,
  noPaymentLabel: string
): ColumnDef<CleaningCaseWithPayment> {
  return {
    accessorKey: 'payment_status',
    header,
    cell: ({ row }) => {
      const payment = row.original.current_month_payment;
      if (payment) {
        return <StatusBadge status={payment.status as any} />;
      }

      // No payment - show warning if after 15th
      if (shouldHighlightRow(row.original)) {
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {missingPaymentLabel}
          </Badge>
        );
      }

      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
          {noPaymentLabel}
        </Badge>
      );
    },
  };
}

/**
 * Creates case status column
 */
function createCaseStatusColumn(
  header: string
): ColumnDef<CleaningCaseWithPayment> {
  return {
    accessorKey: 'status',
    header,
    cell: ({ row }) => <StatusBadge status={row.original.status as any} />,
  };
}

/**
 * Creates end date column (for inactive cases)
 */
function createEndDateColumn(
  header: string
): ColumnDef<CleaningCaseWithPayment> {
  return {
    accessorKey: 'end_date',
    header,
    cell: ({ row }) => {
      if (row.original.end_date) {
        return (
          <div className="text-sm text-slate-700 flex items-center gap-1">
            <CalendarX className="h-3 w-3" />
            {formatDate(row.original.end_date)}
          </div>
        );
      }
      return <div className="text-slate-500">-</div>;
    },
  };
}

/**
 * Creates end reason column (for inactive cases)
 */
function createEndReasonColumn(
  header: string,
  reasons: { healed: string; deceased: string; other: string }
): ColumnDef<CleaningCaseWithPayment> {
  const variants: Record<string, string> = {
    healed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    deceased: 'bg-slate-100 text-slate-700 border-slate-300',
    other: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const reasonLabels: Record<string, string> = {
    healed: reasons.healed,
    deceased: reasons.deceased,
    other: reasons.other,
  };

  return {
    accessorKey: 'end_reason',
    header,
    cell: ({ row }) => {
      const reason = row.original.end_reason;
      if (!reason) return <div className="text-slate-500">-</div>;

      return (
        <Badge variant="outline" className={variants[reason] || ''}>
          {reasonLabels[reason] || reason}
        </Badge>
      );
    },
  };
}

// ========================================
// Main Column Creators
// ========================================

/**
 * Creates active cleaning cases columns
 */
export function createActiveCleaningColumns(
  translations: CleaningColumnsTranslations
): ColumnDef<CleaningCaseWithPayment>[] {
  return [
    createCaseNumberColumn<CleaningCaseWithPayment>(translations.caseNumber),
    createFamilyNameColumn(translations.familyName),
    createCityColumn<CleaningCaseWithPayment>(translations.city),
    createStartDateColumn(translations.startDate),
    createPaymentAmountColumn(translations.currentMonthPayment),
    createPaymentStatusColumn(
      translations.paymentStatus,
      translations.missingPayment,
      translations.noPayment
    ),
    createCaseStatusColumn(translations.status),
  ];
}

/**
 * Creates inactive cleaning cases columns
 */
export function createInactiveCleaningColumns(
  translations: CleaningColumnsTranslations
): ColumnDef<CleaningCaseWithPayment>[] {
  if (!translations.endDate || !translations.endReason || !translations.reasons) {
    throw new Error('Inactive columns require endDate, endReason, and reasons translations');
  }

  return [
    createCaseNumberColumn<CleaningCaseWithPayment>(translations.caseNumber),
    createFamilyNameColumn(translations.familyName),
    createCityColumn<CleaningCaseWithPayment>(translations.city),
    createStartDateColumn(translations.startDate),
    createEndDateColumn(translations.endDate),
    createEndReasonColumn(translations.endReason, translations.reasons),
    createCaseStatusColumn(translations.status),
  ];
}
