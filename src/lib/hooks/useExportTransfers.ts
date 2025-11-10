/**
 * Custom Hook: useExportTransfers
 *
 * ניהול ייצוא העברות (Excel ו-MASAV)
 *
 * Features:
 * - Export to Excel
 * - Export to MASAV
 * - Validation before export
 * - Progress tracking
 * - Error handling
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { TransferWithDetails } from '@/types/transfers.types';
import { PaymentType } from '@/types/case.types';
import {
  ExcelExportOptions,
  MasavExportOptions,
  ExportResult,
} from '@/types/export.types';
import {
  validateTransfersForExport,
  markTransfersAsTransferred,
} from '@/lib/services/transfers.service';

// ========================================
// Types
// ========================================

interface UseExportTransfersOptions {
  paymentType: PaymentType;
  onSuccess?: (result: ExportResult) => void;
  onError?: (error: Error) => void;
  autoMarkTransferred?: boolean; // Auto-update status after export
}

interface UseExportTransfersReturn {
  // State
  isExporting: boolean;
  exportProgress: number;

  // Actions
  exportToExcel: (
    transfers: TransferWithDetails[],
    options?: ExcelExportOptions
  ) => Promise<ExportResult | null>;
  exportToMasav: (
    transfers: TransferWithDetails[],
    options?: MasavExportOptions
  ) => Promise<ExportResult | null>;
  validateForExport: (transfers: TransferWithDetails[]) => boolean;
}

// ========================================
// Hook
// ========================================

export function useExportTransfers({
  paymentType,
  onSuccess,
  onError,
  autoMarkTransferred = true,
}: UseExportTransfersOptions): UseExportTransfersReturn {
  const t = useTranslations('transfers');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // ========================================
  // Validation
  // ========================================

  const validateForExport = useCallback(
    (transfers: TransferWithDetails[]): boolean => {
      if (!transfers || transfers.length === 0) {
        toast.error(t('validation.noSelection'));
        return false;
      }

      const validation = validateTransfersForExport(transfers);

      if (!validation.valid) {
        const errorMessages = Object.entries(validation.errors)
          .slice(0, 3) // Show first 3 errors
          .map(([id, errors]) => {
            const transfer = transfers.find((t) => t.id === id);
            const caseNum = transfer?.case.case_number || 'Unknown';
            return `תיק ${caseNum}: ${errors.join(', ')}`;
          })
          .join('\n');

        toast.error(t('validation.validationFailed'), {
          description: errorMessages,
        });
        return false;
      }

      return true;
    },
    [t]
  );

  // ========================================
  // Export to Excel
  // ========================================

  const exportToExcel = useCallback(
    async (
      transfers: TransferWithDetails[],
      options: ExcelExportOptions = {}
    ): Promise<ExportResult | null> => {
      // Validate
      if (!validateForExport(transfers)) {
        return null;
      }

      setIsExporting(true);
      setExportProgress(0);

      try {
        toast.loading(t('export.exporting'));
        setExportProgress(30);

        // Call API to generate Excel
        const response = await fetch('/api/transfers/export/excel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transfer_ids: transfers.map((t) => t.id),
            payment_type: paymentType,
            options: {
              locale: 'he',
              include_headers: true,
              include_summary: true,
              ...options,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Export failed');
        }

        setExportProgress(70);

        // Get filename from headers
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch
          ? decodeURIComponent(filenameMatch[1])
          : `transfers_export_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportProgress(85);

        // Mark as transferred if enabled (check options first, fallback to autoMarkTransferred)
        const shouldMarkTransferred = options.mark_as_transferred !== undefined
          ? options.mark_as_transferred
          : autoMarkTransferred;

        if (shouldMarkTransferred) {
          await markTransfersAsTransferred(
            transfers.map((t) => t.id),
            `EXCEL_${new Date().toISOString()}`
          );
        }

        setExportProgress(100);
        toast.dismiss();
        toast.success(t('export.success'));

        const result: ExportResult = {
          success: true,
          filename,
          total_count: transfers.length,
          total_amount: transfers.reduce((sum, t) => sum + t.amount_ils, 0),
        };

        onSuccess?.(result);
        return result;
      } catch (error) {
        console.error('Export to Excel failed:', error);
        toast.dismiss();
        toast.error(t('export.error'));
        onError?.(error as Error);
        return null;
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    },
    [paymentType, validateForExport, autoMarkTransferred, onSuccess, onError, t]
  );

  // ========================================
  // Export to MASAV
  // ========================================

  const exportToMasav = useCallback(
    async (
      transfers: TransferWithDetails[],
      options: MasavExportOptions = {}
    ): Promise<ExportResult | null> => {
      // Validate
      if (!validateForExport(transfers)) {
        return null;
      }

      setIsExporting(true);
      setExportProgress(0);

      try {
        toast.loading(t('export.exporting'));
        setExportProgress(30);

        // Call API to generate MASAV
        const response = await fetch('/api/transfers/export/masav', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transfer_ids: transfers.map((t) => t.id),
            payment_type: paymentType,
            options: {
              validate_before_export: true,
              ...options,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Export failed');
        }

        setExportProgress(70);

        // Get filename from headers
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch
          ? decodeURIComponent(filenameMatch[1])
          : `masav_export_${new Date().toISOString().split('T')[0]}.txt`;

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportProgress(85);

        // Mark as transferred if enabled (check options first, fallback to autoMarkTransferred)
        const shouldMarkTransferred = options.mark_as_transferred !== undefined
          ? options.mark_as_transferred
          : autoMarkTransferred;

        if (shouldMarkTransferred) {
          await markTransfersAsTransferred(
            transfers.map((t) => t.id),
            `MASAV_${new Date().toISOString()}`
          );
        }

        setExportProgress(100);
        toast.dismiss();
        toast.success(t('export.success'));

        const result: ExportResult = {
          success: true,
          filename,
          total_count: transfers.length,
          total_amount: transfers.reduce((sum, t) => sum + t.amount_ils, 0),
        };

        onSuccess?.(result);
        return result;
      } catch (error) {
        console.error('Export to MASAV failed:', error);
        toast.dismiss();
        toast.error(t('export.error'));
        onError?.(error as Error);
        return null;
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    },
    [paymentType, validateForExport, autoMarkTransferred, onSuccess, onError, t]
  );

  return {
    // State
    isExporting,
    exportProgress,

    // Actions
    exportToExcel,
    exportToMasav,
    validateForExport,
  };
}
