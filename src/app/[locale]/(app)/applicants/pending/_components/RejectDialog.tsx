'use client';

/**
 * RejectDialog
 *
 * דיאלוג דחיית בקשה
 * לפי CASE_CREATION_SPEC.md סעיף 3.1.4
 */

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { XCircle, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useRejectApplicant, Applicant } from '@/lib/hooks/useApplicants';
import { toast } from 'sonner';

interface RejectDialogProps {
  applicant: Applicant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  locale: string;
}

export function RejectDialog({
  applicant,
  open,
  onOpenChange,
  onSuccess,
}: RejectDialogProps) {
  const t = useTranslations('applicants.reject_dialog');
  const rejectMutation = useRejectApplicant();
  const [reason, setReason] = useState('');

  const formData = applicant.form_data as any;
  const groomName = `${formData.groom_info?.first_name || ''} ${formData.groom_info?.last_name || ''}`.trim();
  const brideName = `${formData.bride_info?.first_name || ''} ${formData.bride_info?.last_name || ''}`.trim();

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({
        applicantId: applicant.id,
        reason: reason.trim() || undefined,
      });

      // Show success toast
      toast.success(t('success_title'), {
        description: t('success_description'),
      });

      // Reset and close
      setReason('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(t('error_title'), {
        description: error.message || t('error_description'),
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={rejectMutation.isPending ? undefined : onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {/* Loading overlay - Full screen blocking */}
        {rejectMutation.isPending && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg border-2 border-red-200">
              <Loader2 className="h-12 w-12 animate-spin text-red-600" />
              <div className="text-center">
                <p className="text-base font-bold text-slate-900">{t('processing')}</p>
                <p className="text-sm text-slate-600 mt-1">{t('please_wait')}</p>
              </div>
            </div>
          </div>
        )}

        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-600" />
            {t('title')}
          </AlertDialogTitle>
          <div className="space-y-4 mt-4 text-base">
            <p className="text-slate-700">{t('question')}</p>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="font-bold text-red-900 text-lg">
                {groomName} {t('and')} {brideName}
              </p>
            </div>

            {/* Reason field */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium text-slate-700">
                {t('reason_label')}
              </Label>
              <Textarea
                id="reason"
                placeholder={t('reason_placeholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border-2 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                rows={3}
                disabled={rejectMutation.isPending}
              />
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">{t('warning')}</p>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel asChild disabled={rejectMutation.isPending}>
            <ActionButton variant="cancel" disabled={rejectMutation.isPending}>
              <X className="h-4 w-4 me-2" />
              {t('cancel')}
            </ActionButton>
          </AlertDialogCancel>
          <ActionButton
            variant="reject-primary"
            onClick={handleReject}
            disabled={rejectMutation.isPending}
            className={rejectMutation.isPending ? 'relative overflow-hidden' : ''}
          >
            {rejectMutation.isPending && (
              <span className="absolute inset-0 bg-red-700 animate-pulse" />
            )}
            <span className="relative flex items-center">
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 me-2 animate-spin" />
                  <span className="animate-pulse">{t('rejecting')}</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 me-2" />
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
