'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActionButton } from '@/components/shared/ActionButton';
import { createClient } from '@/lib/supabase/client';
import { notifySuccess, notifyError } from '@/lib/utils/notifications';
import { PaymentType } from '@/types/case.types';
import { Plus, X } from 'lucide-react';

// ========================================
// Validation Schema
// ========================================

const manualTransferSchema = z.object({
  case_number: z.string().min(1, 'שדה חובה'),
  payment_type: z.nativeEnum(PaymentType),
  amount_ils: z.number().min(1, 'סכום חייב להיות גדול מ-0'),
  amount_usd: z.number().optional(),
  exchange_rate: z.number().optional(),
  payment_month: z.string().optional(),
  bank_number: z.string().min(1, 'מספר בנק הוא שדה חובה').max(3, 'מספר בנק עד 3 ספרות'),
  branch: z.string().min(1, 'סניף הוא שדה חובה').max(3, 'סניף עד 3 ספרות'),
  account_number: z.string().min(1, 'שדה חובה'),
  account_holder_name: z.string().min(2, 'שם בעל החשבון חייב להיות לפחות 2 תווים'),
  notes: z.string().optional(),
});

type ManualTransferFormData = z.infer<typeof manualTransferSchema>;

// ========================================
// Component
// ========================================

interface ManualTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ManualTransferDialog({
  open,
  onOpenChange,
  onSuccess,
}: ManualTransferDialogProps) {
  const t = useTranslations('transfers');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ManualTransferFormData>({
    resolver: zodResolver(manualTransferSchema),
    defaultValues: {
      payment_type: PaymentType.WEDDING_TRANSFER,
      amount_ils: 0,
      amount_usd: 0,
      exchange_rate: 0,
      bank_number: '',
      branch: '',
      account_number: '',
      account_holder_name: '',
      notes: '',
    },
  });

  const paymentType = form.watch('payment_type');

  const handleSubmit = async (data: ManualTransferFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // 1. Find the case by case_number
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('case_number', parseInt(data.case_number))
        .single();

      if (caseError || !caseData) {
        notifyError(t('manualTransfer.errors.caseNotFound'));
        return;
      }

      const caseId = caseData.id;

      // 2. Check if bank_details exist for this case, if not create
      let bankDetailsId: string;

      const { data: existingBankDetails } = await supabase
        .from('bank_details')
        .select('id')
        .eq('case_id', caseId)
        .maybeSingle();

      if (existingBankDetails) {
        // Update existing
        const { error: updateError } = await supabase
          .from('bank_details')
          .update({
            bank_number: data.bank_number,
            branch: data.branch,
            account_number: data.account_number,
            account_holder_name: data.account_holder_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingBankDetails.id);

        if (updateError) throw updateError;
        bankDetailsId = existingBankDetails.id;
      } else {
        // Create new
        const { data: newBankDetails, error: insertError } = await supabase
          .from('bank_details')
          .insert({
            case_id: caseId,
            bank_number: data.bank_number,
            branch: data.branch,
            account_number: data.account_number,
            account_holder_name: data.account_holder_name,
          })
          .select('id')
          .single();

        if (insertError || !newBankDetails) throw insertError;
        bankDetailsId = newBankDetails.id;
      }

      // 3. Create the payment (transfer)
      const paymentData: any = {
        case_id: caseId,
        payment_type: data.payment_type,
        amount_ils: data.amount_ils,
        status: 'approved', // Set as approved by default for manual transfers
        notes: data.notes || null,
      };

      // Add wedding-specific fields
      if (data.payment_type === PaymentType.WEDDING_TRANSFER) {
        paymentData.amount_usd = data.amount_usd || null;
        paymentData.exchange_rate = data.exchange_rate || null;
      }

      // Add cleaning-specific fields
      if (data.payment_type === PaymentType.MONTHLY_CLEANING) {
        paymentData.payment_month = data.payment_month || null;
      }

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData);

      if (paymentError) throw paymentError;

      notifySuccess(t('manualTransfer.success'));
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create manual transfer:', error);
      notifyError(t('manualTransfer.errors.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="h-5 w-5 text-sky-600" />
            {t('manualTransfer.title')}
          </DialogTitle>
          <DialogDescription>{t('manualTransfer.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Case Number */}
            <FormField
              control={form.control}
              name="case_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('manualTransfer.fields.caseNumber')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder={t('manualTransfer.placeholders.caseNumber')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Type */}
            <FormField
              control={form.control}
              name="payment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('manualTransfer.fields.paymentType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PaymentType.WEDDING_TRANSFER}>
                        {t('manualTransfer.paymentTypes.wedding')}
                      </SelectItem>
                      <SelectItem value={PaymentType.MONTHLY_CLEANING}>
                        {t('manualTransfer.paymentTypes.cleaning')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount ILS */}
            <FormField
              control={form.control}
              name="amount_ils"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('manualTransfer.fields.amountIls')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      placeholder={t('manualTransfer.placeholders.amountIls')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Wedding-specific fields */}
            {paymentType === PaymentType.WEDDING_TRANSFER && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount_usd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('manualTransfer.fields.amountUsd')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exchange_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('manualTransfer.fields.exchangeRate')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          placeholder="3.70"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Cleaning-specific fields */}
            {paymentType === PaymentType.MONTHLY_CLEANING && (
              <FormField
                control={form.control}
                name="payment_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('manualTransfer.fields.paymentMonth')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="month"
                        placeholder="YYYY-MM"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Bank Details */}
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50/30">
              <h3 className="font-semibold text-sm text-slate-700">
                {t('manualTransfer.sections.bankDetails')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bank_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('manualTransfer.fields.bankNumber')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12" maxLength={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('manualTransfer.fields.branch')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123" maxLength={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('manualTransfer.fields.accountNumber')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123456" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_holder_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('manualTransfer.fields.accountHolderName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('manualTransfer.placeholders.accountHolderName')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('manualTransfer.fields.notes')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('manualTransfer.placeholders.notes')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <ActionButton
                type="button"
                variant="cancel"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 me-2" />
                {tCommon('cancel')}
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 me-2" />
                {isSubmitting ? t('manualTransfer.submitting') : t('manualTransfer.submit')}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
