'use client';

import { useState} from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertTriangle, Heart, HeartOff, HelpCircle } from 'lucide-react';

interface CloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  onSuccess?: () => void;
  hasPendingPayments?: boolean;
  pendingPaymentInfo?: {
    month: string;
    amount: number;
  };
}

type CloseReason = 'healed' | 'deceased' | 'other';

/**
 * CloseDialog - Dialog for closing a sick children case
 *
 * Features:
 * - Select close reason
 * - Optional notes
 * - Warning for pending payments
 *
 * עקרונות SOLID:
 * - Single Responsibility: מנהל רק סגירת תיק
 * - שימוש בקומפוננטות UI קיימות
 */
export function CloseDialog({
  open,
  onOpenChange,
  caseId,
  onSuccess,
  hasPendingPayments,
  pendingPaymentInfo,
}: CloseDialogProps) {
  const t = useTranslations('sickChildren.closeCase');
  const tCommon = useTranslations('common');

  const [reason, setReason] = useState<CloseReason>('healed');
  const [notes, setNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = async () => {
    setIsClosing(true);
    try {
      const response = await fetch(`/api/cleaning-cases/${caseId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'שגיאה בסגירת התיק');
        return;
      }

      toast.success('התיק נסגר בהצלחה');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error closing case:', error);
      toast.error('שגיאה בסגירת התיק');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('confirm')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-3">
            <Label>{t('reason')}</Label>
            <RadioGroup
              value={reason}
              onValueChange={(value) => setReason(value as CloseReason)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="healed" id="healed" />
                <Label htmlFor="healed" className="flex items-center gap-2 cursor-pointer">
                  <Heart className="h-4 w-4 text-emerald-600" />
                  {t('healed')}
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="deceased" id="deceased" />
                <Label htmlFor="deceased" className="flex items-center gap-2 cursor-pointer">
                  <HeartOff className="h-4 w-4 text-slate-600" />
                  {t('deceased')}
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="flex items-center gap-2 cursor-pointer">
                  <HelpCircle className="h-4 w-4 text-slate-600" />
                  {t('other')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הסבר נוסף..."
              rows={3}
            />
          </div>

          {/* Pending Payments Warning */}
          {hasPendingPayments && pendingPaymentInfo && (
            <Alert variant="destructive" className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {t('warningPendingPayments', {
                  month: pendingPaymentInfo.month,
                  amount: pendingPaymentInfo.amount,
                })}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClosing}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClose}
            disabled={isClosing}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {isClosing ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                סוגר...
              </>
            ) : (
              t('confirmButton')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * ReopenDialog - Simple confirmation dialog for reopening a case
 */
interface ReopenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  onSuccess?: () => void;
}

export function ReopenDialog({
  open,
  onOpenChange,
  caseId,
  onSuccess,
}: ReopenDialogProps) {
  const t = useTranslations('sickChildren.closeCase');
  const tCommon = useTranslations('common');

  const [isReopening, setIsReopening] = useState(false);

  const handleReopen = async () => {
    setIsReopening(true);
    try {
      const response = await fetch(`/api/cleaning-cases/${caseId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'שגיאה בפתיחת התיק');
        return;
      }

      toast.success('התיק הוחזר לפעיל');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error reopening case:', error);
      toast.error('שגיאה בפתיחת התיק');
    } finally {
      setIsReopening(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('reopenCase')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('confirmReopen')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isReopening}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReopen}
            disabled={isReopening}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isReopening ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                מחזיר...
              </>
            ) : (
              t('reopenCase')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
