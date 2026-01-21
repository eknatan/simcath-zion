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
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { ActionButton } from '@/components/shared/ActionButton';
import { CheckCircle2, X, Loader2 } from 'lucide-react';
import { useApproveApplicant, ApproveApplicantError, Applicant } from '@/lib/hooks/useApplicants';
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
  const submitterInfo = formData.submitter_info;

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
    } catch (error: unknown) {
      // Check if this is an "already processed" error
      if (error instanceof ApproveApplicantError && error.code === 'ALREADY_PROCESSED') {
        if (error.currentStatus === 'approved') {
          toast.info(t('already_approved_title'), {
            description: t('already_approved_description'),
          });
        } else {
          toast.warning(t('already_processed_title'), {
            description: t('already_processed_description'),
          });
        }
        // Close dialog and refresh the list
        onOpenChange(false);
        return;
      }

      // Generic error
      const errorMessage = error instanceof Error ? error.message : t('error_description');
      toast.error(t('error_title'), {
        description: errorMessage,
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={approveMutation.isPending ? undefined : onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {/* Loading overlay - Full screen blocking */}
        {approveMutation.isPending && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg border-2 border-green-200">
              <Loader2 className="h-12 w-12 animate-spin text-green-600" />
              <div className="text-center">
                <p className="text-base font-bold text-slate-900">{t('processing')}</p>
                <p className="text-sm text-slate-600 mt-1">{t('please_wait')}</p>
              </div>
            </div>
          </div>
        )}

        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            {t('title')}
          </AlertDialogTitle>
          <div className="space-y-3 mt-4 text-base">
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
            {/* פרטי מגיש הבקשה */}
            {submitterInfo?.submitter_name && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">{t('submitter_label')}:</span>{' '}
                  {submitterInfo.submitter_name}
                  {submitterInfo.submitter_relation && (
                    <span className="text-amber-700"> ({submitterInfo.submitter_relation})</span>
                  )}
                </p>
                {submitterInfo.submitter_phone && (
                  <p className="text-sm text-amber-800 mt-1">
                    <span className="font-semibold">{t('submitter_phone_label')}:</span>{' '}
                    <span dir="ltr">{submitterInfo.submitter_phone}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel asChild disabled={approveMutation.isPending}>
            <ActionButton variant="cancel" disabled={approveMutation.isPending}>
              <X className="h-4 w-4 me-2" />
              {t('cancel')}
            </ActionButton>
          </AlertDialogCancel>
          <ActionButton
            variant="approve-primary"
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className={approveMutation.isPending ? 'relative overflow-hidden' : ''}
          >
            {approveMutation.isPending && (
              <span className="absolute inset-0 bg-green-700 animate-pulse" />
            )}
            <span className="relative flex items-center">
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 me-2 animate-spin" />
                  <span className="animate-pulse">{t('approving')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 me-2" />
                  {t('confirm')}
                </>
              )}
            </span>
          </ActionButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
