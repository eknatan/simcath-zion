'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ExcelImportError } from '@/types/manual-transfers.types';

interface ValidationErrorsTableProps {
  errors: ExcelImportError[];
  onExportErrors: () => void;
}

const FIELD_NAMES: Record<string, string> = {
  recipient_name: 'שם מקבל',
  id_number: 'תעודת זהות',
  amount: 'סכום',
  bank_code: 'קוד בנק',
  branch_code: 'קוד סניף',
  account_number: 'מספר חשבון',
  all: 'כל השדות',
  unknown: 'לא ידוע',
};

export function ValidationErrorsTable({ errors, onExportErrors }: ValidationErrorsTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
          {rowNumbers.length} שורות לא עברו את הולידציה ולא ייובאו
        </AlertDescription>
      </Alert>

      {/* Error details table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-3 py-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">פירוט שגיאות</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportErrors}
            className="h-7 text-xs"
          >
            <Download className="h-3 w-3 me-1" />
            הורד דוח שגיאות
          </Button>
        </div>

        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-start text-slate-600 font-medium w-20">שורה</th>
                <th className="px-3 py-2 text-start text-slate-600 font-medium w-28">שדה</th>
                <th className="px-3 py-2 text-start text-slate-600 font-medium">שגיאה</th>
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
                  הצג פחות
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 me-1" />
                  הצג עוד {rowNumbers.length - 5} שורות
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
