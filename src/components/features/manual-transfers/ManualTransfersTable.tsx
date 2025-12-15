'use client';

import { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { ActionButton } from '@/components/shared/ActionButton';
import { Trash2, Pencil } from 'lucide-react';
import type { ManualTransfer } from '@/types/manual-transfers.types';
import { DataTable } from '@/components/shared/DataTable/DataTable';

interface ManualTransfersTableProps {
  transfers: ManualTransfer[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onEdit?: (transfer: ManualTransfer) => void;
  onRefresh: () => void;
  showExportedDate?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
}

export function ManualTransfersTable({
  transfers,
  selectedIds,
  onSelectionChange,
  onDelete,
  onEdit,
  showExportedDate = false,
  enablePagination = false,
  pageSize = 50,
}: ManualTransfersTableProps) {
  const t = useTranslations('manualTransfers');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  };

  const getStatusBadge = useCallback((status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      selected: 'bg-blue-100 text-blue-700 border-blue-200',
      exported: 'bg-green-100 text-green-700 border-green-200',
    };

    const statusKey = status as 'pending' | 'selected' | 'exported';

    return (
      <span className={`px-2 py-1 rounded-sm text-xs font-medium border ${styles[statusKey] || styles.pending}`}>
        {t(`table.status.${statusKey}`)}
      </span>
    );
  }, [t]);

  const columns = useMemo<ColumnDef<ManualTransfer>[]>(() => {
    const handleSelectAllMemo = (checked: boolean) => {
      if (checked) {
        onSelectionChange(transfers.map((t) => t.id));
      } else {
        onSelectionChange([]);
      }
    };

    const handleSelectOneMemo = (id: string) => {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    };

    return [
    {
      id: 'select',
      header: () => (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.length === transfers.length && transfers.length > 0}
            onCheckedChange={handleSelectAllMemo}
            aria-label={t('table.columns.selectAll')}
          />
          <span className="text-xs text-muted-foreground">{t('table.columns.selectAll')}</span>
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.includes(row.original.id)}
          onCheckedChange={() => handleSelectOneMemo(row.original.id)}
          aria-label={`${t('table.columns.selectAll')} ${row.original.recipient_name}`}
        />
      ),
      size: 70,
    },
    {
      accessorKey: 'recipient_name',
      header: () => <span className="font-semibold">{t('table.columns.recipientName')}</span>,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.recipient_name}</span>
      ),
    },
    {
      accessorKey: 'id_number',
      header: () => <span className="font-semibold">{t('table.columns.idNumber')}</span>,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.id_number || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <span className="font-semibold">{t('table.columns.amount')}</span>,
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: 'bank_code',
      header: () => <span className="font-semibold">{t('table.columns.bank')}</span>,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.bank_code}</span>
      ),
    },
    {
      accessorKey: 'branch_code',
      header: () => <span className="font-semibold">{t('table.columns.branch')}</span>,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.branch_code}</span>
      ),
    },
    {
      accessorKey: 'account_number',
      header: () => <span className="font-semibold">{t('table.columns.account')}</span>,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.account_number}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <span className="font-semibold">{t('table.columns.status')}</span>,
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: showExportedDate ? 'exported_at' : 'created_at',
      header: () => <span className="font-semibold">{showExportedDate ? t('table.columns.exportedAt') : t('table.columns.createdAt')}</span>,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {showExportedDate
            ? (row.original.exported_at ? formatDate(row.original.exported_at) : formatDate(row.original.created_at))
            : formatDate(row.original.created_at)
          }
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-center font-semibold">{t('table.columns.actions')}</div>,
      cell: ({ row }) => (
        <div className="flex gap-2 justify-center">
          {onEdit && (
            <ActionButton
              variant="view"
              size="sm"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="h-3 w-3" />
            </ActionButton>
          )}
          <ActionButton
            variant="reject"
            size="sm"
            onClick={() => onDelete(row.original.id)}
          >
            <Trash2 className="h-3 w-3" />
          </ActionButton>
        </div>
      ),
      size: 100,
    },
  ];
  }, [selectedIds, transfers, showExportedDate, onDelete, onEdit, onSelectionChange, t, getStatusBadge]);

  return (
    <div className="space-y-0">
      <DataTable
        columns={columns}
        data={transfers}
        isLoading={false}
        pagination={{
          showPagination: enablePagination,
          pageSize: pageSize,
        }}
      />

      {/* Summary footer */}
      {transfers.length > 0 && (
        <div className="bg-slate-50 border border-t-0 rounded-b-lg px-4 py-3 flex justify-between items-center text-sm">
          <div className="text-muted-foreground">
            {t('table.summary.selected', { selected: selectedIds.length, total: transfers.length })}
          </div>
          <div className="font-semibold">
            {t('table.summary.total')}{' '}
            {formatCurrency(
              transfers
                .filter((transfer) => selectedIds.includes(transfer.id))
                .reduce((sum, transfer) => sum + transfer.amount, 0)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
