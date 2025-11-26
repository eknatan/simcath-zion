'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Loader2,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { WeddingCaseStatus } from '@/types/case.types';

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  currentStatus: WeddingCaseStatus | string;
  onSuccess?: () => void;
}

const STATUS_CONFIG = {
  [WeddingCaseStatus.NEW]: {
    icon: Sparkles,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
  },
  [WeddingCaseStatus.PENDING_TRANSFER]: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  [WeddingCaseStatus.TRANSFERRED]: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  [WeddingCaseStatus.REJECTED]: {
    icon: XCircle,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
  [WeddingCaseStatus.EXPIRED]: {
    icon: AlertTriangle,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
};

/**
 * UpdateStatusDialog - Dialog for manually updating wedding case status
 *
 * Allows secretary to change case status with optional notes.
 * Used for manual status updates outside the normal payment flow.
 */
export function UpdateStatusDialog({
  open,
  onOpenChange,
  caseId,
  currentStatus,
  onSuccess,
}: UpdateStatusDialogProps) {
  const t = useTranslations('case');
  const tStatus = useTranslations('status');
  const tCommon = useTranslations('common');

  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (selectedStatus === currentStatus) {
      toast.info(t('statusDialog.noChange'));
      onOpenChange(false);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || t('statusDialog.error'));
        return;
      }

      toast.success(t('statusDialog.success'));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('statusDialog.error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const statuses = Object.values(WeddingCaseStatus);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">
            {t('actions.updateStatus')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            {t('statusDialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Selection */}
          <div className="space-y-3">
            <Label>{t('statusDialog.statusLabel')}</Label>
            <RadioGroup
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              className="space-y-2"
            >
              {statuses.map((status) => {
                const config = STATUS_CONFIG[status];
                const Icon = config?.icon || Sparkles;
                const isCurrentStatus = status === currentStatus;

                return (
                  <div
                    key={status}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      selectedStatus === status
                        ? `${config?.bgColor} ${config?.borderColor} border-2`
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <RadioGroupItem value={status} id={status} />
                    <Label
                      htmlFor={status}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <Icon className={`h-4 w-4 ${config?.color}`} />
                      <span className="font-medium">{tStatus(status)}</span>
                      {isCurrentStatus && (
                        <span className="text-xs text-slate-500 me-auto">
                          {t('statusDialog.current')}
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('statusDialog.notesLabel')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('statusDialog.notesPlaceholder')}
              rows={3}
              dir="rtl"
            />
          </div>
        </div>

        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel disabled={isUpdating}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUpdate}
            disabled={isUpdating || selectedStatus === currentStatus}
            className="bg-sky-600 hover:bg-sky-700"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('statusDialog.updating')}
              </>
            ) : (
              t('statusDialog.submit')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
