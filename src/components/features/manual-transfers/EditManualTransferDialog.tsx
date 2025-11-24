'use client';

import { useEffect, useState } from 'react';
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
import { ActionButton } from '@/components/shared/ActionButton';
import { manualTransfersService } from '@/lib/services/manual-transfers.service';
import { toast } from 'sonner';
import { Pencil, X, Save } from 'lucide-react';
import type { ManualTransfer } from '@/types/manual-transfers.types';

// ========================================
// Validation Schema
// ========================================

const editManualTransferSchema = z.object({
  recipient_name: z.string().min(2, 'שם חייב להיות לפחות 2 תווים'),
  id_number: z.string().optional(),
  bank_code: z.string().min(1, 'קוד בנק הוא שדה חובה').max(3, 'קוד בנק עד 3 ספרות'),
  branch_code: z.string().min(1, 'קוד סניף הוא שדה חובה').max(3, 'סניף עד 3 ספרות'),
  account_number: z.string().min(1, 'מספר חשבון חובה'),
  amount: z.number().min(1, 'סכום חייב להיות גדול מ-0'),
});

type EditManualTransferFormData = z.infer<typeof editManualTransferSchema>;

// ========================================
// Component
// ========================================

interface EditManualTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: ManualTransfer | null;
  onSuccess?: () => void;
}

export function EditManualTransferDialog({
  open,
  onOpenChange,
  transfer,
  onSuccess,
}: EditManualTransferDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditManualTransferFormData>({
    resolver: zodResolver(editManualTransferSchema),
    defaultValues: {
      recipient_name: '',
      id_number: '',
      bank_code: '',
      branch_code: '',
      account_number: '',
      amount: 0,
    },
  });

  // Update form when transfer changes
  useEffect(() => {
    if (transfer) {
      form.reset({
        recipient_name: transfer.recipient_name,
        id_number: transfer.id_number || '',
        bank_code: transfer.bank_code,
        branch_code: transfer.branch_code,
        account_number: transfer.account_number,
        amount: transfer.amount,
      });
    }
  }, [transfer, form]);

  const handleSubmit = async (data: EditManualTransferFormData) => {
    if (!transfer) return;

    setIsSubmitting(true);
    try {
      const { error } = await manualTransfersService.update(transfer.id, {
        recipient_name: data.recipient_name,
        id_number: data.id_number || undefined,
        bank_code: data.bank_code,
        branch_code: data.branch_code,
        account_number: data.account_number,
        amount: data.amount,
      });

      if (error) throw error;

      toast.success('הצלחה', {
        description: 'ההעברה עודכנה בהצלחה',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update manual transfer:', error);
      toast.error('שגיאה', {
        description: 'שגיאה בעדכון ההעברה',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pencil className="h-5 w-5 text-blue-600" />
            עריכת העברה
          </DialogTitle>
          <DialogDescription>
            ערוך את פרטי ההעברה
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
                  <FormLabel>שם מקבל התשלום *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="הזן שם מלא"
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
                  <FormLabel>תעודת זהות (אופציונלי)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="123456789"
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
                  <FormLabel>סכום (₪) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
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
                    <FormLabel>בנק *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="12" maxLength={3} />
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
                    <FormLabel>סניף *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123" maxLength={3} />
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
                    <FormLabel>חשבון *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123456" />
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
                ביטול
              </ActionButton>
              <ActionButton
                type="submit"
                variant="approve-primary"
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 me-2" />
                {isSubmitting ? 'שומר...' : 'שמור שינויים'}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
