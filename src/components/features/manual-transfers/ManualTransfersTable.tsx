'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      selected: 'bg-blue-100 text-blue-700 border-blue-200',
      exported: 'bg-green-100 text-green-700 border-green-200',
    };

    const labels = {
      pending: 'ממתין',
      selected: 'נבחר',
      exported: 'יוצא',
    };

    return (
      <span className={`px-2 py-1 rounded-sm text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

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
        <Checkbox
          checked={selectedIds.length === transfers.length && transfers.length > 0}
          onCheckedChange={handleSelectAllMemo}
          aria-label="בחר הכל"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.includes(row.original.id)}
          onCheckedChange={() => handleSelectOneMemo(row.original.id)}
          aria-label={`בחר ${row.original.recipient_name}`}
        />
      ),
      size: 50,
    },
    {
      accessorKey: 'recipient_name',
      header: 'שם מקבל',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.recipient_name}</span>
      ),
    },
    {
      accessorKey: 'id_number',
      header: 'תעודת זהות',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.id_number || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'סכום',
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: 'bank_code',
      header: 'בנק',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.bank_code}</span>
      ),
    },
    {
      accessorKey: 'branch_code',
      header: 'סניף',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.branch_code}</span>
      ),
    },
    {
      accessorKey: 'account_number',
      header: 'חשבון',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.account_number}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'סטטוס',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: showExportedDate ? 'exported_at' : 'created_at',
      header: showExportedDate ? 'תאריך ייצוא' : 'תאריך יצירה',
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
      header: () => <div className="text-center">פעולות</div>,
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
  }, [selectedIds, transfers, showExportedDate, onDelete, onEdit, onSelectionChange]);

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
            <span className="font-semibold">{selectedIds.length}</span> נבחרו מתוך{' '}
            <span className="font-semibold">{transfers.length}</span>
          </div>
          <div className="font-semibold">
            סה&quot;כ:{' '}
            {formatCurrency(
              transfers
                .filter((t) => selectedIds.includes(t.id))
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
