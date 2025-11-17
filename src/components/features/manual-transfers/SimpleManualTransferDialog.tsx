'use client';

import { useState } from 'react';
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
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

// ========================================
// Validation Schema
// ========================================

const simpleManualTransferSchema = z.object({
  recipient_name: z.string().min(2, 'שם חייב להיות לפחות 2 תווים'),
  id_number: z.string().optional(),
  bank_code: z.string().min(1, 'קוד בנק הוא שדה חובה').max(3, 'קוד בנק עד 3 ספרות'),
  branch_code: z.string().min(1, 'קוד סניף הוא שדה חובה').max(3, 'סניף עד 3 ספרות'),
  account_number: z.string().min(1, 'מספר חשבון חובה'),
  amount: z.number().min(1, 'סכום חייב להיות גדול מ-0'),
});

type SimpleManualTransferFormData = z.infer<typeof simpleManualTransferSchema>;

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SimpleManualTransferFormData>({
    resolver: zodResolver(simpleManualTransferSchema),
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

      toast.success('הצלחה', {
        description: 'ההעברה נוספה בהצלחה',
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create manual transfer:', error);
      toast.error('שגיאה', {
        description: 'שגיאה ביצירת ההעברה',
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
            <Plus className="h-5 w-5 text-emerald-600" />
            הוסף העברה ידנית
          </DialogTitle>
          <DialogDescription>
            הזן את פרטי ההעברה (6 שדות בלבד)
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
                <Plus className="h-4 w-4 me-2" />
                {isSubmitting ? 'מוסיף...' : 'הוסף העברה'}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
