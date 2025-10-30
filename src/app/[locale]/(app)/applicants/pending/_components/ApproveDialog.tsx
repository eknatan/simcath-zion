'use client';

/**
 * ApproveDialog
 *
 * דיאלוג אישור בקשה ויצירת תיק
 * לפי CASE_CREATION_SPEC.md סעיף 3.1.3
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
import { CheckCircle2, X, Loader2 } from 'lucide-react';
import { useApproveApplicant, Applicant } from '@/lib/hooks/useApplicants';
import { toast } from 'sonner';

interface ApproveDialogProps {
  applicant: Applicant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (caseId: string) => void;
  locale: string;
}

export function ApproveDialog({
  applicant,
  open,
  onOpenChange,
  onSuccess,
}: ApproveDialogProps) {
  const t = useTranslations('applicants.approve_dialog');
  const approveMutation = useApproveApplicant();

  const formData = applicant.form_data as any;
  const groomName = `${formData.groom_info?.first_name || ''} ${formData.groom_info?.last_name || ''}`.trim();
  const brideName = `${formData.bride_info?.first_name || ''} ${formData.bride_info?.last_name || ''}`.trim();

  const handleApprove = async () => {
    try {
      const result = await approveMutation.mutateAsync(applicant.id);

      // Show success toast
      toast.success(result.message || t('success_title'), {
        description: t('success_description'),
      });

      // Close dialog
      onOpenChange(false);

      // Navigate to case
      onSuccess(result.case.id);
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
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            {t('title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            <div className="space-y-3 mt-4">
              <p className="text-slate-700">{t('question')}</p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <p className="font-bold text-blue-900 text-lg">
                  {groomName} {t('and')} {brideName}
                </p>
              </div>
              <p className="text-slate-600 text-sm">{t('description')}</p>
              <div className="bg-slate-100 rounded-lg p-3 border-2 border-slate-200">
                <p className="text-sm">
                  <span className="text-slate-600">{t('case_number_label')}:</span>
                  <span className="font-bold text-slate-900 ms-2">W7XXX</span>
                  <span className="text-slate-500 text-xs ms-2">({t('automatic')})</span>
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
            variant="approve-primary"
            onClick={handleApprove}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 me-2" />
            )}
            {approveMutation.isPending ? t('approving') : t('confirm')}
          </ActionButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
