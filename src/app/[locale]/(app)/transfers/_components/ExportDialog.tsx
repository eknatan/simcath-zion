'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MasavUrgency } from '@/types/export.types';
import { FileSpreadsheet, Building2 } from 'lucide-react';

export type ExportDialogType = 'excel' | 'masav' | null;

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ExportDialogType;
  onConfirm: (options: any) => void;
  isExporting: boolean;
}

export function ExportDialog({
  open,
  onOpenChange,
  type,
  onConfirm,
  isExporting,
}: ExportDialogProps) {
  const t = useTranslations('transfers.export');

  // Excel options
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  // MASAV options
  const [urgency, setUrgency] = useState<MasavUrgency>(MasavUrgency.REGULAR);
  const [executionDate, setExecutionDate] = useState('');
  const [validateFirst, setValidateFirst] = useState(true);

  // Common option - Mark as transferred and move cases to history
  const [markAsTransferred, setMarkAsTransferred] = useState(false);

  const handleConfirm = () => {
    if (type === 'excel') {
      onConfirm({
        include_headers: includeHeaders,
        include_summary: includeSummary,
        mark_as_transferred: markAsTransferred,
      });
    } else if (type === 'masav') {
      onConfirm({
        urgency,
        execution_date: executionDate || undefined,
        validate_before_export: validateFirst,
        mark_as_transferred: markAsTransferred,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'excel' ? (
              <>
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                {t('excel.title')}
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5 text-sky-600" />
                {t('masav.title')}
              </>
            )}
          </DialogTitle>
          <DialogDescription>{t('selectType')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {type === 'excel' && (
            <>
              {/* Include Headers */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="headers"
                  checked={includeHeaders}
                  onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
                />
                <Label htmlFor="headers" className="text-sm font-medium text-slate-700">
                  {t('excel.includeHeaders')}
                </Label>
              </div>

              {/* Include Summary */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="summary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                />
                <Label htmlFor="summary" className="text-sm font-medium text-slate-700">
                  {t('excel.includeSummary')}
                </Label>
              </div>

              {/* Mark as Transferred */}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="markAsTransferred"
                    checked={markAsTransferred}
                    onCheckedChange={(checked) => setMarkAsTransferred(checked as boolean)}
                  />
                  <Label htmlFor="markAsTransferred" className="text-sm font-medium text-slate-700">
                    {t('markAsTransferred')}
                  </Label>
                </div>
                <p className="text-xs text-slate-500 mr-6">{t('markAsTransferredHint')}</p>
              </div>
            </>
          )}

          {type === 'masav' && (
            <>
              {/* Urgency */}
              <div className="space-y-2">
                <Label htmlFor="urgency" className="text-sm font-medium text-slate-700">
                  {t('masav.urgency')}
                </Label>
                <Select value={urgency} onValueChange={(value) => setUrgency(value as MasavUrgency)}>
                  <SelectTrigger id="urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MasavUrgency.REGULAR}>{t('masav.regular')}</SelectItem>
                    <SelectItem value={MasavUrgency.URGENT}>{t('masav.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Execution Date */}
              <div className="space-y-2">
                <Label htmlFor="executionDate" className="text-sm font-medium text-slate-700">
                  {t('masav.executionDate')}
                </Label>
                <Input
                  id="executionDate"
                  type="date"
                  value={executionDate}
                  onChange={(e) => setExecutionDate(e.target.value)}
                  className="border-slate-200"
                />
              </div>

              {/* Validate First */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validate"
                  checked={validateFirst}
                  onCheckedChange={(checked) => setValidateFirst(checked as boolean)}
                />
                <Label htmlFor="validate" className="text-sm font-medium text-slate-700">
                  {t('masav.validateFirst')}
                </Label>
              </div>

              {/* Mark as Transferred */}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="markAsTransferredMasav"
                    checked={markAsTransferred}
                    onCheckedChange={(checked) => setMarkAsTransferred(checked as boolean)}
                  />
                  <Label htmlFor="markAsTransferredMasav" className="text-sm font-medium text-slate-700">
                    {t('markAsTransferred')}
                  </Label>
                </div>
                <p className="text-xs text-slate-500 mr-6">{t('markAsTransferredHint')}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="border-slate-200"
          >
            ביטול
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isExporting}
            className={`shadow-sm ${
              type === 'excel'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            {isExporting ? t('exporting') : 'ייצוא'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
