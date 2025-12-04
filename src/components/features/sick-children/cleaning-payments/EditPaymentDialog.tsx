'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { HEBREW_MONTHS, type EditPaymentDialogProps } from './types';

/**
 * EditPaymentDialog - Dialog for editing an existing payment
 *
 * Single Responsibility: Only handles payment editing.
 * Receives payment data and save callback from parent.
 */
export function EditPaymentDialog({
  open,
  onOpenChange,
  payment,
  onSave,
  isSaving,
  years,
  monthlyCap,
}: EditPaymentDialogProps) {
  const t = useTranslations('sickChildren.payments');
  const tCommon = useTranslations('common');

  // Local form state
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showCapWarning, setShowCapWarning] = useState(false);

  // Sync form state when payment changes or dialog opens
  useEffect(() => {
    if (payment && open) {
      const date = new Date(payment.payment_month!);
      setMonth((date.getMonth() + 1).toString());
      setYear(date.getFullYear().toString());
      setAmount(payment.amount_ils?.toString() || '');
      setNotes(payment.notes || '');
      // Check cap warning on load
      const numAmount = payment.amount_ils || 0;
      setShowCapWarning(numAmount > monthlyCap);
    }
  }, [payment, open, monthlyCap]);

  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
    const numValue = parseFloat(value);
    setShowCapWarning(!isNaN(numValue) && numValue > monthlyCap);
  }, [monthlyCap]);

  const handleSave = useCallback(async () => {
    if (payment) {
      const success = await onSave(payment.id, { month, year, amount, notes });
      if (success) {
        onOpenChange(false);
      }
    }
  }, [payment, onSave, month, year, amount, notes, onOpenChange]);

  const isFormValid = month && year && amount;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('editPayment')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('updatePaymentDetails')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 grid-cols-2">
            {/* Month Select */}
            <div className="space-y-2">
              <Label>{t('month')}</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectMonth')} />
                </SelectTrigger>
                <SelectContent>
                  {HEBREW_MONTHS.map((monthName, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {monthName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Select */}
            <div className="space-y-2">
              <Label>{t('year')}</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>{t('amount')}</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="720"
              min="0"
              step="0.01"
            />
            {showCapWarning && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('warningOverCap', { cap: monthlyCap })}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder') || 'הערות אופציונליות...'}
              rows={2}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSave}
            disabled={isSaving || !isFormValid}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {tCommon('saving')}
              </>
            ) : (
              t('saveChanges')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
