'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
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
import { ActionButton } from '@/components/shared/ActionButton';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

// ========================================
// Validation Schema
// ========================================

const createSchema = (t: (key: string) => string) => z.object({
  recipient_name: z.string().min(2, t('form.validation.nameMinLength')),
  id_number: z.string().optional(),
  bank_code: z.string().min(1, t('form.validation.bankRequired')).max(3, t('form.validation.bankMaxLength')),
  branch_code: z.string().min(1, t('form.validation.branchRequired')).max(3, t('form.validation.branchMaxLength')),
  account_number: z.string().min(1, t('form.validation.accountRequired')),
  amount: z.number().min(1, t('form.validation.amountMin')),
});

type SimpleManualTransferFormData = {
  recipient_name: string;
  id_number?: string;
  bank_code: string;
  branch_code: string;
  account_number: string;
  amount: number;
};

// ========================================
// Component
// ========================================

interface SimpleManualTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SimpleManualTransferDialog({
  open,
  onOpenChange,
  onSuccess,
}: SimpleManualTransferDialogProps) {
  const t = useTranslations('manualTransfers');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SimpleManualTransferFormData>({
    resolver: zodResolver(createSchema(t)),
    defaultValues: {
      recipient_name: '',
      id_number: '',
      bank_code: '',
      branch_code: '',
      account_number: '',
      amount: 0,
    },
  });

  const handleSubmit = async (data: SimpleManualTransferFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert manual transfer
      const { error } = await supabase
        .from('manual_transfers')
        .insert({
          recipient_name: data.recipient_name,
          id_number: data.id_number || null,
          bank_code: data.bank_code,
          branch_code: data.branch_code,
          account_number: data.account_number,
          amount: data.amount,
          status: 'pending',
          created_by: user?.id || null,
        });

      if (error) throw error;

      toast.success(t('common.success'), {
        description: t('messages.createSuccess'),
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create manual transfer:', error);
      toast.error(t('common.error'), {
        description: t('messages.createError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="h-5 w-5 text-emerald-600" />
            {t('form.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('form.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Recipient Name */}
            <FormField
              control={form.control}
              name="recipient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.recipientName')} {t('form.required')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('form.fields.recipientNamePlaceholder')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ID Number (Optional) */}
            <FormField
              control={form.control}
              name="id_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.idNumber')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('form.fields.idNumberPlaceholder')}
                      maxLength={9}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.amount')} {t('form.required')}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty, digits, and single decimal point
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          field.onChange(value === '' ? 0 : parseFloat(value) || 0);
                        }
                      }}
                      placeholder={t('form.fields.amountPlaceholder')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bank Details */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bank_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.bank')} {t('form.required')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('form.fields.bankPlaceholder')} maxLength={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.branch')} {t('form.required')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('form.fields.branchPlaceholder')} maxLength={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.account')} {t('form.required')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('form.fields.accountPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <ActionButton
                type="button"
                variant="cancel"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 me-2" />
                {t('common.cancel')}
              </ActionButton>
              <ActionButton
                type="submit"
                variant="approve-primary"
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 me-2" />
                {isSubmitting ? t('form.adding') : t('form.addButton')}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
