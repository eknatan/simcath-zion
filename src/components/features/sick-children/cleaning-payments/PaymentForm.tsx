'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Save, AlertTriangle, Loader2, Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { HEBREW_MONTHS, type PaymentFormProps } from './types';

/**
 * PaymentForm - Form for adding a new monthly payment
 *
 * Single Responsibility: Only handles adding new payments, not editing.
 */
export function PaymentForm({
  onSubmit,
  isSaving,
  monthlyCap,
  years,
}: PaymentFormProps) {
  const t = useTranslations('sickChildren.payments');
  const tCommon = useTranslations('common');

  // Local form state
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showCapWarning, setShowCapWarning] = useState(false);

  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
    const numValue = parseFloat(value);
    setShowCapWarning(!isNaN(numValue) && numValue > monthlyCap);
  }, [monthlyCap]);

  const handleSubmit = useCallback(async () => {
    const success = await onSubmit({ month, year, amount, notes });
    if (success) {
      // Reset form on success
      setMonth('');
      setAmount('');
      setNotes('');
      setShowCapWarning(false);
    }
  }, [onSubmit, month, year, amount, notes]);

  const isFormValid = month && amount;

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Banknote className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>{t('addPayment')}</CardTitle>
            <CardDescription>
              {t('cap')}: {formatCurrency(monthlyCap)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
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

        {/* Save Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSaving || !isFormValid}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {tCommon('saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 me-2" />
              {t('save')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
