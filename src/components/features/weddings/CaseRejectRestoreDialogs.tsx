'use client';

/**
 * CaseRejectRestoreDialogs
 *
 * דיאלוגים לדחייה, סגירה ושחזור תיקי חתונה
 * - RejectCaseDialog: דחיית תיק עם סיבה אופציונלית (לתיקים ללא תשלום)
 * - CloseCaseDialog: סגירת תיק (לתיקים עם תשלום - ללא צורך בסיבה)
 * - RestoreCaseDialog: שחזור תיק נדחה או שהועבר
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
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
import { XCircle, X, AlertTriangle, Loader2, RotateCcw, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// ===========================================
// RejectCaseDialog
// ===========================================

interface RejectCaseDialogProps {
  caseId: string;
  caseNumber: string;
  groomName?: string;
  brideName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RejectCaseDialog({
  caseId,
  caseNumber,
  groomName,
  brideName,
  open,
  onOpenChange,
  onSuccess,
}: RejectCaseDialogProps) {
  const t = useTranslations('case.rejectDialog');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const displayName = groomName && brideName
    ? `${groomName} & ${brideName}`
    : `תיק ${caseNumber}`;

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('errorDescription'));
      }

      toast.success(t('successTitle'), {
        description: t('successDescription'),
      });

      setReason('');
      onOpenChange(false);
      onSuccess?.();
      // Invalidate calendar queries so the rejected case disappears from calendar
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events-yearly'] });
      router.refresh();
    } catch (error: any) {
      toast.error(t('errorTitle'), {
        description: error.message || t('errorDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg border-2 border-red-200">
              <Loader2 className="h-12 w-12 animate-spin text-red-600" />
              <div className="text-center">
                <p className="text-base font-bold text-slate-900">{t('processing')}</p>
                <p className="text-sm text-slate-600 mt-1">{t('pleaseWait')}</p>
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
              <p className="font-bold text-red-900 text-lg">{displayName}</p>
            </div>

            {/* Reason field */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium text-slate-700">
                {t('reasonLabel')}
              </Label>
              <Textarea
                id="reason"
                placeholder={t('reasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border-2 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                rows={3}
                disabled={isLoading}
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
          <AlertDialogCancel asChild disabled={isLoading}>
            <ActionButton variant="cancel" disabled={isLoading}>
              <X className="h-4 w-4 me-2" />
              {t('cancel')}
            </ActionButton>
          </AlertDialogCancel>
          <ActionButton
            variant="reject-primary"
            onClick={handleReject}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('rejecting')}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 me-2" />
                {t('confirm')}
              </>
            )}
          </ActionButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ===========================================
// RestoreCaseDialog
// ===========================================

interface RestoreCaseDialogProps {
  caseId: string;
  caseNumber: string;
  groomName?: string;
  brideName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RestoreCaseDialog({
  caseId,
  caseNumber,
  groomName,
  brideName,
  open,
  onOpenChange,
  onSuccess,
}: RestoreCaseDialogProps) {
  const t = useTranslations('case.restoreDialog');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const displayName = groomName && brideName
    ? `${groomName} & ${brideName}`
    : `תיק ${caseNumber}`;

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/restore`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a 30-day expiration error
        if (data.error === 'Cannot restore after 30 days') {
          toast.error(t('expiredTitle'), {
            description: t('expiredDescription'),
          });
          return;
        }
        throw new Error(data.error || t('errorDescription'));
      }

      toast.success(t('successTitle'), {
        description: t('successDescription'),
      });

      onOpenChange(false);
      onSuccess?.();
      // Invalidate calendar queries so the restored case appears in calendar
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events-yearly'] });
      router.refresh();
    } catch (error: any) {
      toast.error(t('errorTitle'), {
        description: error.message || t('errorDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg border-2 border-emerald-200">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
              <div className="text-center">
                <p className="text-base font-bold text-slate-900">{t('processing')}</p>
                <p className="text-sm text-slate-600 mt-1">{t('pleaseWait')}</p>
              </div>
            </div>
          </div>
        )}

        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-emerald-600" />
            {t('title')}
          </AlertDialogTitle>
          <div className="space-y-4 mt-4 text-base">
            <p className="text-slate-700">{t('question')}</p>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
              <p className="font-bold text-emerald-900 text-lg">{displayName}</p>
            </div>

            {/* Info */}
            <div className="bg-sky-50 border-2 border-sky-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-sky-900">{t('info')}</p>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel asChild disabled={isLoading}>
            <ActionButton variant="cancel" disabled={isLoading}>
              <X className="h-4 w-4 me-2" />
              {t('cancel')}
            </ActionButton>
          </AlertDialogCancel>
          <ActionButton
            variant="restore-primary"
            onClick={handleRestore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('restoring')}
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 me-2" />
                {t('confirm')}
              </>
            )}
          </ActionButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ===========================================
// CloseCaseDialog
// ===========================================

interface CloseCaseDialogProps {
  caseId: string;
  caseNumber: string;
  groomName?: string;
  brideName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CloseCaseDialog({
  caseId,
  caseNumber,
  groomName,
  brideName,
  open,
  onOpenChange,
  onSuccess,
}: CloseCaseDialogProps) {
  const t = useTranslations('case.closeDialog');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const displayName = groomName && brideName
    ? `${groomName} & ${brideName}`
    : `תיק ${caseNumber}`;

  const handleClose = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/close`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('errorDescription'));
      }

      toast.success(t('successTitle'), {
        description: t('successDescription'),
      });

      onOpenChange(false);
      onSuccess?.();
      // Invalidate calendar queries so the closed case is updated in calendar
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events-yearly'] });
      router.refresh();
    } catch (error: any) {
      toast.error(t('errorTitle'), {
        description: error.message || t('errorDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg border-2 border-emerald-200">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
              <div className="text-center">
                <p className="text-base font-bold text-slate-900">{t('processing')}</p>
                <p className="text-sm text-slate-600 mt-1">{t('pleaseWait')}</p>
              </div>
            </div>
          </div>
        )}

        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            {t('title')}
          </AlertDialogTitle>
          <div className="space-y-4 mt-4 text-base">
            <p className="text-slate-700">{t('question')}</p>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
              <p className="font-bold text-emerald-900 text-lg">{displayName}</p>
            </div>

            {/* Info */}
            <div className="bg-sky-50 border-2 border-sky-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-sky-900">{t('info')}</p>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel asChild disabled={isLoading}>
            <ActionButton variant="cancel" disabled={isLoading}>
              <X className="h-4 w-4 me-2" />
              {t('cancel')}
            </ActionButton>
          </AlertDialogCancel>
          <ActionButton
            variant="restore-primary"
            onClick={handleClose}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('closing')}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 me-2" />
                {t('confirm')}
              </>
            )}
          </ActionButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
