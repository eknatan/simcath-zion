'use client';

/**
 * RestoreDialog
 *
 * דיאלוג שחזור בקשה נדחית
 * לפי CASE_CREATION_SPEC.md סעיף 3.1.5
 */

import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { ActionButton } from '@/components/shared/ActionButton';
import { RotateCcw, X, Loader2 } from 'lucide-react';
import { useRestoreApplicant, Applicant } from '@/lib/hooks/useApplicants';
import { toast } from 'sonner';

interface RestoreDialogProps {
  applicant: Applicant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  locale: string;
}

export function RestoreDialog({
  applicant,
  open,
  onOpenChange,
  onSuccess,
}: RestoreDialogProps) {
  const t = useTranslations('applicants.restore_dialog');
  const restoreMutation = useRestoreApplicant();

  const formData = applicant.form_data as any;
  const groomName = `${formData.groom_info?.first_name || ''} ${formData.groom_info?.last_name || ''}`.trim();
  const brideName = `${formData.bride_info?.first_name || ''} ${formData.bride_info?.last_name || ''}`.trim();

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(applicant.id);

      // Show success toast
      toast.success(t('success_title'), {
        description: t('success_description'),
      });

      // Close and refresh
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(t('error_title'), {
        description: error.message || t('error_description'),
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-blue-600" />
            {t('title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            <div className="space-y-4 mt-4">
              <p className="text-slate-700">{t('question')}</p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <p className="font-bold text-blue-900 text-lg">
                  {groomName} {t('and')} {brideName}
                </p>
              </div>
              <div className="bg-slate-100 border-2 border-slate-200 rounded-lg p-3">
                <p className="text-sm text-slate-700">
                  {t('description_prefix')} <span className="font-bold text-amber-700">{t('pending_status')}</span>
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel asChild>
            <ActionButton variant="cancel">
              <X className="h-4 w-4 me-2" />
              {t('cancel')}
            </ActionButton>
          </AlertDialogCancel>
          <ActionButton
            variant="restore-primary"
            onClick={handleRestore}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 me-2" />
            )}
            {restoreMutation.isPending ? t('restoring') : t('confirm')}
          </ActionButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
