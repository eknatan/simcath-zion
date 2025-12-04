'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExcelParser } from '@/lib/utils/excel-parser';
import { manualTransfersService } from '@/lib/services/manual-transfers.service';
import { ValidationErrorsTable } from './ValidationErrorsTable';
import type { ExcelImportResult } from '@/types/manual-transfers.types';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExcelImportDialog({ open, onOpenChange, onSuccess }: ExcelImportDialogProps) {
  const t = useTranslations('manualTransfers');
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setImporting(true);

    try {
      const result = await ExcelParser.processImport(selectedFile);
      setImportResult(result);

      if (result.success) {
        setStep('preview');
      } else {
        setError(result.errors[0]?.errorMessage || t('import.processError'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('import.unexpectedError'));
    } finally {
      setImporting(false);
    }
  };

  const handleConfirm = async () => {
    if (!importResult || !file) return;

    setImporting(true);
    setError(null);

    try {
      const userId = user?.id;

      console.log('Sending transfers to bulkCreate:', importResult.transfers);

      const result = await manualTransfersService.bulkCreate(
        importResult.transfers as never[],
        userId,
        file.name
      );

      if (result.error) {
        console.error('BulkCreate error:', result.error);
        setError(result.error.message);
        return;
      }

      setStep('complete');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('handleConfirm error:', err);
      setError(err instanceof Error ? err.message : t('import.saveError'));
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setImportResult(null);
    setError(null);
    onOpenChange(false);
  };

  const handleExportErrors = async () => {
    if (!importResult || importResult.errors.length === 0) return;

    try {
      const blob = await ExcelParser.exportErrorsToExcel(importResult.errors);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = file?.name?.replace(/\.[^/.]+$/, '') || 'import';
      a.download = `${baseName}_errors.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting errors:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('import.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('import.uploadTitle')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('import.uploadDescription')}
                </p>
                <label htmlFor="file-upload">
                  <Button type="button" disabled={importing} asChild>
                    <span>
                      <Upload className="h-4 w-4 me-2" />
                      {importing ? t('import.processing') : t('import.selectFile')}
                    </span>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={importing}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && importResult && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {t('import.successMessage', { valid: importResult.valid_rows, total: importResult.total_rows })}
                </AlertDescription>
              </Alert>

              {importResult.invalid_rows > 0 && (
                <ValidationErrorsTable
                  errors={importResult.errors}
                  onExportErrors={handleExportErrors}
                />
              )}

              {/* Preview table */}
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-start">{t('import.previewColumns.name')}</th>
                      <th className="px-3 py-2 text-start">{t('import.previewColumns.amount')}</th>
                      <th className="px-3 py-2 text-start">{t('import.previewColumns.bank')}</th>
                      <th className="px-3 py-2 text-start">{t('import.previewColumns.branch')}</th>
                      <th className="px-3 py-2 text-start">{t('import.previewColumns.account')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.transfers.slice(0, 10).map((transfer, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{transfer.recipient_name}</td>
                        <td className="px-3 py-2">₪{transfer.amount?.toFixed(2)}</td>
                        <td className="px-3 py-2">{transfer.bank_code}</td>
                        <td className="px-3 py-2">{transfer.branch_code}</td>
                        <td className="px-3 py-2">{transfer.account_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleClose} disabled={importing}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleConfirm} disabled={importing}>
                  {importing ? t('common.saving') : t('import.importButton', { count: importResult.valid_rows })}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('import.completeTitle')}</h3>
              <p className="text-muted-foreground">
                {t('import.completeMessage', { count: importResult?.valid_rows ?? 0 })}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
