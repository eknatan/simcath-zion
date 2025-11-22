'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import {
  TransferWithDetails,
  WeddingTransfer,
  CleaningTransfer,
  TransferTab,
  TransferTypeFilter,
} from '@/types/transfers.types';
import { formatDate } from '@/lib/services/export.service';
import { DataTable } from '@/components/shared/DataTable/DataTable';

interface TransfersTableProps {
  transfers: TransferWithDetails[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  activeTab: TransferTab;
  typeFilter: TransferTypeFilter;
  isLoading?: boolean;
}

export function TransfersTable({
  transfers,
  selectedIds,
  onToggleSelection,
  activeTab,
  typeFilter,
  isLoading = false,
}: TransfersTableProps) {
  const t = useTranslations('transfers');
  const router = useRouter();
  const showTransferred = activeTab === TransferTab.TRANSFERRED;

  const handleRowClick = (transfer: TransferWithDetails) => {
    router.push(`/cases/${transfer.case_id}`);
  };

  // Define columns based on type filter
  const columns = useMemo<ColumnDef<TransferWithDetails>[]>(() => {
    const baseColumns: ColumnDef<TransferWithDetails>[] = [
      {
        id: 'select',
        header: () => <div className="ps-2"><span className="sr-only">Select</span></div>,
        cell: ({ row }) => (
          <div className="ps-2">
            <Checkbox
              checked={selectedIds.includes(row.original.id)}
              onCheckedChange={() => onToggleSelection(row.original.id)}
              className="border-slate-300"
            />
          </div>
        ),
        size: 50,
      },
      {
        accessorKey: 'created_at',
        header: t('columns.created_at'),
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.created_at
              ? formatDate(row.original.created_at, 'he')
              : '-'}
          </span>
        ),
      },
    ];

    // Add transferred date column if showing transferred
    if (showTransferred) {
      baseColumns.push({
        accessorKey: 'transferred_at',
        header: t('columns.transferred_at'),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-emerald-700">
            {row.original.transferred_at
              ? formatDate(row.original.transferred_at, 'he')
              : '-'}
          </span>
        ),
      });
    }

    // Case Number
    baseColumns.push({
      accessorKey: 'case.case_number',
      header: t('columns.case_number'),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="border-sky-200 text-sky-700 bg-sky-50"
        >
          {row.original.case.case_number}
        </Badge>
      ),
    });

    // Type-specific columns
    if (typeFilter === TransferTypeFilter.WEDDING) {
      baseColumns.push(
        {
          id: 'names',
          header: t('columns.names'),
          cell: ({ row }) => {
            const transfer = row.original as WeddingTransfer;
            const groomName = transfer.case.groom_first_name || '';
            const brideName = transfer.case.bride_first_name || '';
            const brideLastName = transfer.case.bride_last_name || '';
            const names = `${groomName} & ${brideName} ${brideLastName}`.trim();
            return <span className="text-sm text-slate-700">{names || '-'}</span>;
          },
        },
        {
          id: 'wedding_date',
          header: t('columns.wedding_date'),
          cell: ({ row }) => {
            const transfer = row.original as WeddingTransfer;
            return (
              <span className="text-sm text-slate-600">
                {transfer.case.wedding_date_gregorian
                  ? formatDate(transfer.case.wedding_date_gregorian, 'he')
                  : '-'}
              </span>
            );
          },
        },
        {
          id: 'city',
          header: t('columns.city'),
          cell: ({ row }) => {
            const transfer = row.original as WeddingTransfer;
            return <span className="text-sm text-slate-600">{transfer.case.city || '-'}</span>;
          },
        }
      );
    } else if (typeFilter === TransferTypeFilter.CLEANING) {
      baseColumns.push(
        {
          id: 'family_name',
          header: t('columns.family_name'),
          cell: ({ row }) => {
            const transfer = row.original as CleaningTransfer;
            return <span className="text-sm text-slate-700">{transfer.case.family_name || '-'}</span>;
          },
        },
        {
          id: 'child_name',
          header: t('columns.child_name'),
          cell: ({ row }) => {
            const transfer = row.original as CleaningTransfer;
            return <span className="text-sm text-slate-700">{transfer.case.child_name || '-'}</span>;
          },
        },
        {
          id: 'payment_month',
          header: t('columns.payment_month'),
          cell: ({ row }) => {
            const transfer = row.original as CleaningTransfer;
            return <span className="text-sm text-slate-600">{transfer.payment_month || '-'}</span>;
          },
        }
      );
    } else {
      // Mixed type columns
      baseColumns.push(
        {
          accessorKey: 'payment_type',
          header: t('columns.type'),
          cell: ({ row }) => {
            const isWedding = row.original.payment_type === 'wedding_transfer';
            return (
              <Badge
                variant="outline"
                className={
                  isWedding
                    ? 'border-sky-200 text-sky-700 bg-sky-50'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                }
              >
                {isWedding ? t('types.wedding') : t('types.cleaning')}
              </Badge>
            );
          },
        },
        {
          id: 'details',
          header: t('columns.details'),
          cell: ({ row }) => {
            const isWedding = row.original.payment_type === 'wedding_transfer';
            const isCleaning = row.original.payment_type === 'cleaning_monthly';

            return (
              <span className="text-sm text-slate-700">
                {isWedding && (
                  <>
                    {(row.original.case as any).groom_first_name || ''} & {(row.original.case as any).bride_first_name || ''} {(row.original.case as any).bride_last_name || ''}
                  </>
                )}
                {isCleaning && (
                  <>
                    {(row.original.case as any).family_name || ''} - {(row.original.case as any).child_name || ''}
                  </>
                )}
              </span>
            );
          },
        }
      );
    }

    // Amount columns
    baseColumns.push({
      accessorKey: 'amount_ils',
      header: () => <div className="text-end">{t('columns.amount_ils')}</div>,
      cell: ({ row }) => (
        <div className="text-end font-medium text-slate-900">
          {row.original.amount_ils.toLocaleString('he-IL')} ₪
        </div>
      ),
    });

    if (typeFilter === TransferTypeFilter.WEDDING) {
      baseColumns.push({
        accessorKey: 'amount_usd',
        header: () => <div className="text-end">{t('columns.amount_usd')}</div>,
        cell: ({ row }) => (
          <div className="text-end text-slate-600">
            ${row.original.amount_usd?.toLocaleString('en-US') || '0'}
          </div>
        ),
      });
    }

    // Bank details columns
    baseColumns.push(
      {
        accessorKey: 'bank_details.account_holder_name',
        header: t('columns.account_holder'),
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.bank_details.account_holder_name}
          </span>
        ),
      },
      {
        accessorKey: 'bank_details.bank_number',
        header: t('columns.bank'),
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.bank_details.bank_number}
          </span>
        ),
      },
      {
        accessorKey: 'bank_details.branch',
        header: t('columns.branch'),
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.bank_details.branch}
          </span>
        ),
      },
      {
        accessorKey: 'bank_details.account_number',
        header: t('columns.account'),
        cell: ({ row }) => (
          <span className="text-sm text-slate-600 font-mono">
            {row.original.bank_details.account_number}
          </span>
        ),
      }
    );

    // Actions column
    baseColumns.push({
      id: 'actions',
      header: () => <div className="text-center">{t('columns.actions')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row.original);
            }}
            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
          >
            <ExternalLink className="w-4 h-4 me-1" />
            {t('actions.viewCase')}
          </Button>
        </div>
      ),
      size: 120,
    });

    return baseColumns;
  }, [typeFilter, showTransferred, selectedIds, onToggleSelection, t, handleRowClick]);

  return (
    <div className="border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden">
      <DataTable
        columns={columns}
        data={transfers}
        isLoading={isLoading}
        rowClassName={(row) => {
          const isSelected = selectedIds.includes(row.id);
          return isSelected ? 'bg-sky-50/30 hover:bg-sky-50/50' : 'hover:bg-slate-50/50';
        }}
      />
    </div>
  );
}
