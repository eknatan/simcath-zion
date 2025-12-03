'use client';

/**
 * ApplicantViewDialog
 *
 * דיאלוג צפייה בבקשה (read-only) + ייצוא PDF
 * עודכן: החלפת JSON בתצוגה קריאה + אפשרות ייצוא
 *
 * לפי CASE_CREATION_SPEC.md סעיף 3.1.2
 * עיצוב: DESIGN_SYSTEM.md (Version B - Soft & Matte)
 */

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ActionButton } from '@/components/shared/ActionButton';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Applicant } from '@/lib/hooks/useApplicants';
import { FormRenderer, WeddingFormData } from '@/components/shared/FormRenderer';
import { ExportPDFButton } from '@/components/shared/ExportDocument';
import { ExportWord } from '@/components/shared/ExportWord';

interface ApplicantViewDialogProps {
  applicant: Applicant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

export function ApplicantViewDialog({
  applicant,
  open,
  onOpenChange,
  locale,
}: ApplicantViewDialogProps) {
  const t = useTranslations('applicants.view_dialog');
  const formData = applicant.form_data as WeddingFormData;

  // נתונים לשם הקובץ
  const groomName = formData.groom_info?.first_name || 'groom';
  const brideName = formData.bride_info?.first_name || 'bride';
  const filename = `application_${groomName}_${brideName}_${applicant.id.substring(0, 8)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="border-b-2 border-slate-200 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 text-start">
              <DialogTitle className="text-2xl font-bold text-blue-600">
                📋 {t('title')} #{applicant.id.substring(0, 8).toUpperCase()}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {t('description')}
              </DialogDescription>
            </div>
            <Badge
              className={`${
                applicant.status === 'rejected'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              } px-3 py-1 font-medium whitespace-nowrap ms-auto`}
            >
              {applicant.status === 'rejected' ? t('status.rejected') : t('status.pending')}
            </Badge>
          </div>
        </DialogHeader>

        {/* Rejection reason (if rejected) */}
        {applicant.status === 'rejected' && formData.rejection_reason && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 my-4">
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-medium">{t('rejection_reason')}:</span>
              <span className="text-red-800">{formData.rejection_reason}</span>
            </div>
          </div>
        )}

        {/* Content - תצוגה קריאה במקום JSON */}
        <div className="py-4">
          <FormRenderer
            formData={formData}
            caseType={applicant.case_type as 'wedding'}
            exportMode={false}
          />
        </div>

        {/* Footer */}
        <DialogFooter className="border-t-2 border-slate-200 pt-4 flex flex-row gap-3 justify-between">
          <div className="flex gap-2">
            {/* ייצוא Word */}
            <ExportWord
              formData={formData}
              filename={filename}
              locale={locale}
              variant="primary"
              size="default"
              onExportComplete={() => {
                // אופציונלי: ניתן להוסיף tracking או הודעה
              }}
            />

            {/* ייצוא PDF */}
            <ExportPDFButton
              documentType="application"
              data={formData}
              filename={filename}
              variant="outline"
              size="default"
            />
          </div>

          {/* כפתור סגירה */}
          <ActionButton variant="cancel" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 me-2" />
            {t('close')}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
