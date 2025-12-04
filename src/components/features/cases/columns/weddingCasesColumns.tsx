'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Heart, Check, X, FileText, Landmark, Clock } from 'lucide-react';
import { CaseForTable, REQUIRED_WEDDING_FILES } from '@/types/case.types';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { formatHebrewDateForDisplay } from '@/lib/utils/hebrew-date-parser';
import {
  createCaseNumberColumn,
  createCityColumn,
  createStatusColumn,
  createActionsColumn,
} from './sharedColumns';

/**
 * Format Hebrew date from structured fields
 */
function formatHebrewDate(
  day: number | null | undefined,
  month: number | null | undefined,
  year: number | null | undefined
): string | null {
  if (!day || !month || !year) return null;
  return formatHebrewDateForDisplay(day, month, year, 'he');
}

/**
 * Column definitions translations interface
 */
export interface WeddingColumnsTranslations {
  caseNumber: string;
  createdAt: string;
  names: string;
  weddingDate: string;
  requestedAmount: string;
  approvedAmount: string;
  notApproved: string;
  bankDetails: string;
  files: string;
  status: string;
  actions: string;
  viewAction: string;
}

/**
 * Creates wedding case columns with translations
 */
export function createWeddingCasesColumns(
  translations: WeddingColumnsTranslations,
  onViewCase: (id: string) => void
): ColumnDef<CaseForTable>[] {
  return [
    // Case number
    createCaseNumberColumn<CaseForTable>(translations.caseNumber),

    // Created at
    {
      accessorKey: 'created_at',
      header: translations.createdAt,
      cell: ({ row }) => {
        if (row.original.created_at) {
          return (
            <div className="text-sm text-slate-600">
              {formatDate(row.original.created_at)}
            </div>
          );
        }
        return <div className="text-slate-500">-</div>;
      },
    },

    // Names (Groom & Bride)
    {
      accessorKey: 'names',
      header: translations.names,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-900">
            {row.original.groom_first_name} {row.original.groom_last_name}
          </div>
          <div className="text-sm text-slate-600 flex items-center gap-1">
            <Heart className="h-3 w-3 text-rose-400" />
            {row.original.bride_first_name} {row.original.bride_last_name}
          </div>
        </div>
      ),
    },

    // Wedding date (Hebrew + Gregorian)
    {
      accessorKey: 'wedding_date',
      header: translations.weddingDate,
      cell: ({ row }) => {
        if (row.original.wedding_date_gregorian) {
          const hebrewDateStr =
            formatHebrewDate(
              row.original.hebrew_day,
              row.original.hebrew_month,
              row.original.hebrew_year
            ) || row.original.wedding_date_hebrew;

          return (
            <div className="text-sm">
              {hebrewDateStr && (
                <div className="font-medium text-slate-900">{hebrewDateStr}</div>
              )}
              <div className="text-slate-600">
                {formatDate(row.original.wedding_date_gregorian)}
              </div>
            </div>
          );
        }
        return <div className="text-slate-500">-</div>;
      },
    },

    // Requested amount (total_cost)
    {
      accessorKey: 'total_cost',
      header: translations.requestedAmount,
      cell: ({ row }) => {
        if (row.original.total_cost) {
          return (
            <div className="text-slate-700">{formatCurrency(row.original.total_cost)}</div>
          );
        }
        return <div className="text-slate-500">-</div>;
      },
    },

    // Approved amount
    {
      accessorKey: 'approved_amount',
      header: translations.approvedAmount,
      cell: ({ row }) => {
        if (row.original.approved_amount) {
          return (
            <div className="font-semibold text-emerald-700">
              {formatCurrency(row.original.approved_amount)}
            </div>
          );
        }
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
            <Clock className="h-3 w-3 me-1" />
            {translations.notApproved}
          </Badge>
        );
      },
    },

    // Bank details indicator
    {
      accessorKey: 'has_bank_details',
      header: () => <div className="text-center">{translations.bankDetails}</div>,
      cell: ({ row }) => {
        const hasBankDetails = row.original.has_bank_details;
        return (
          <div className="flex justify-center">
            {hasBankDetails ? (
              <div className="flex items-center gap-1 text-emerald-600">
                <Landmark className="h-4 w-4" />
                <Check className="h-3 w-3" />
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-400">
                <Landmark className="h-4 w-4" />
                <X className="h-3 w-3" />
              </div>
            )}
          </div>
        );
      },
    },

    // Files indicator
    {
      accessorKey: 'files_count',
      header: () => <div className="text-center">{translations.files}</div>,
      cell: ({ row }) => {
        const requiredCount = REQUIRED_WEDDING_FILES.length;
        const uploadedRequired = row.original.required_files_count;
        const isComplete = uploadedRequired >= requiredCount;

        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={
                isComplete
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }
            >
              <FileText className="h-3 w-3 me-1" />
              {uploadedRequired}/{requiredCount}
            </Badge>
          </div>
        );
      },
    },

    // Status
    createStatusColumn<CaseForTable>(translations.status),

    // Actions
    createActionsColumn<CaseForTable>(
      translations.actions,
      translations.viewAction,
      onViewCase
    ),
  ];
}
