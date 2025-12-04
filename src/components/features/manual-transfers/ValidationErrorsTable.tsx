'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ExcelImportError } from '@/types/manual-transfers.types';

interface ValidationErrorsTableProps {
  errors: ExcelImportError[];
  onExportErrors: () => void;
}

export function ValidationErrorsTable({ errors, onExportErrors }: ValidationErrorsTableProps) {
  const t = useTranslations('manualTransfers');
  const [isExpanded, setIsExpanded] = useState(false);

  const FIELD_NAMES: Record<string, string> = {
    recipient_name: t('validation.fieldNames.recipientName'),
    id_number: t('validation.fieldNames.idNumber'),
    amount: t('validation.fieldNames.amount'),
    bank_code: t('validation.fieldNames.bankCode'),
    branch_code: t('validation.fieldNames.branchCode'),
    account_number: t('validation.fieldNames.accountNumber'),
    all: t('validation.fieldNames.all'),
    unknown: t('validation.fieldNames.unknown'),
  };

  if (errors.length === 0) return null;

  // Group errors by row number
  const errorsByRow = errors.reduce((acc, error) => {
    const rowNum = error.rowNumber;
    if (!acc[rowNum]) {
      acc[rowNum] = [];
    }
    acc[rowNum].push(error);
    return acc;
  }, {} as Record<number, ExcelImportError[]>);

  const rowNumbers = Object.keys(errorsByRow).map(Number).sort((a, b) => a - b);
  const displayedRows = isExpanded ? rowNumbers : rowNumbers.slice(0, 5);
  const hasMoreRows = rowNumbers.length > 5;

  return (
    <div className="space-y-3">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('validation.rowsFailedValidation', { count: rowNumbers.length })}
        </AlertDescription>
      </Alert>

      {/* Error details table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-3 py-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{t('validation.title')}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportErrors}
            className="h-7 text-xs"
          >
            <Download className="h-3 w-3 me-1" />
            {t('validation.downloadReport')}
          </Button>
        </div>

        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-start text-slate-600 font-medium w-20">{t('validation.columns.row')}</th>
                <th className="px-3 py-2 text-start text-slate-600 font-medium w-28">{t('validation.columns.field')}</th>
                <th className="px-3 py-2 text-start text-slate-600 font-medium">{t('validation.columns.error')}</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((rowNum) =>
                errorsByRow[rowNum].map((error, idx) => (
                  <tr key={`${rowNum}-${idx}`} className="border-t hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-slate-700 font-mono">{rowNum}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {FIELD_NAMES[error.field || 'unknown'] || error.field}
                    </td>
                    <td className="px-3 py-2 text-red-600">{error.errorMessage}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Expand/collapse button */}
        {hasMoreRows && (
          <div className="border-t px-3 py-2 bg-slate-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full h-7 text-xs text-slate-600"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 me-1" />
                  {t('validation.showLess')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 me-1" />
                  {t('validation.showMore', { count: rowNumbers.length - 5 })}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
