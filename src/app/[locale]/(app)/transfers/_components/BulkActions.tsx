'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';
import { FileSpreadsheet, Building2, RefreshCw, X } from 'lucide-react';

interface BulkActionsProps {
  isAllSelected: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleAll: () => void;
  onExportExcel: () => void;
  onExportMasav: () => void;
  onRefresh: () => void;
  onDeselectAll: () => void;
  isExporting?: boolean;
}

export function BulkActions({
  isAllSelected,
  selectedCount,
  totalCount,
  onToggleAll,
  onExportExcel,
  onExportMasav,
  onRefresh,
  onDeselectAll,
  isExporting = false,
}: BulkActionsProps) {
  const t = useTranslations('transfers.actions');

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Select All Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="select-all"
          checked={isAllSelected}
          onCheckedChange={onToggleAll}
          className="border-slate-300"
        />
        <label
          htmlFor="select-all"
          className="text-sm font-medium text-slate-700 cursor-pointer"
        >
          {isAllSelected ? t('deselectAll') : t('selectAll')}
          {selectedCount > 0 && (
            <span className="text-sky-600 ms-2">
              ({selectedCount}/{totalCount})
            </span>
          )}
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Export Excel */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportExcel}
          disabled={isExporting || selectedCount === 0}
          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="w-4 h-4 me-2" />
          {t('exportExcel')}
        </Button>

        {/* Export MASAV */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportMasav}
          disabled={isExporting || selectedCount === 0}
          className="border-sky-200 text-sky-700 hover:bg-sky-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Building2 className="w-4 h-4 me-2" />
          {t('exportMasav')}
        </Button>

        {/* Deselect All */}
        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeselectAll}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <X className="w-4 h-4 me-2" />
            {t('deselectAll')}
          </Button>
        )}

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4 me-2" />
          {t('refresh')}
        </Button>
      </div>
    </div>
  );
}
