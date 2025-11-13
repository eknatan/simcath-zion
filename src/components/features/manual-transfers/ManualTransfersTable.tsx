'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ActionButton } from '@/components/shared/ActionButton';
import { Trash2, FileDown } from 'lucide-react';
import type { ManualTransfer } from '@/types/manual-transfers.types';

interface ManualTransfersTableProps {
  transfers: ManualTransfer[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function ManualTransfersTable({
  transfers,
  selectedIds,
  onSelectionChange,
  onDelete,
}: ManualTransfersTableProps) {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onSelectionChange(transfers.map((t) => t.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
      setSelectAll(false);
    }
  };

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

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-start w-[50px]">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  aria-label="בחר הכל"
                />
              </th>
              <th className="px-4 py-3 text-start font-semibold">שם מקבל</th>
              <th className="px-4 py-3 text-start font-semibold">תעודת זהות</th>
              <th className="px-4 py-3 text-start font-semibold">סכום</th>
              <th className="px-4 py-3 text-start font-semibold">בנק</th>
              <th className="px-4 py-3 text-start font-semibold">סניף</th>
              <th className="px-4 py-3 text-start font-semibold">חשבון</th>
              <th className="px-4 py-3 text-start font-semibold">סטטוס</th>
              <th className="px-4 py-3 text-start font-semibold">תאריך</th>
              <th className="px-4 py-3 text-center font-semibold w-[100px]">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                  <FileDown className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>אין העברות להצגה</p>
                  <p className="text-xs mt-1">העלה קובץ אקסל כדי להתחיל</p>
                </td>
              </tr>
            ) : (
              transfers.map((transfer) => (
                <tr key={transfer.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.includes(transfer.id)}
                      onCheckedChange={(checked) => handleSelectOne(transfer.id, checked as boolean)}
                      aria-label={`בחר ${transfer.recipient_name}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{transfer.recipient_name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {transfer.id_number || '-'}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(transfer.amount)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{transfer.bank_code}</td>
                  <td className="px-4 py-3 font-mono text-xs">{transfer.branch_code}</td>
                  <td className="px-4 py-3 font-mono text-xs">{transfer.account_number}</td>
                  <td className="px-4 py-3">{getStatusBadge(transfer.status)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(transfer.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <ActionButton
                        variant="reject"
                        size="sm"
                        onClick={() => onDelete(transfer.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      {transfers.length > 0 && (
        <div className="bg-slate-50 border-t px-4 py-3 flex justify-between items-center text-sm">
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
