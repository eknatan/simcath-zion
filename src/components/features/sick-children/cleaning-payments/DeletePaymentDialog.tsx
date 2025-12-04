'use client';

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
import { Loader2 } from 'lucide-react';
import type { DeletePaymentDialogProps } from './types';

/**
 * DeletePaymentDialog - Confirmation dialog for deleting a payment
 *
 * Single Responsibility: Only handles delete confirmation.
 * Minimal interface - just open state and confirm callback.
 */
export function DeletePaymentDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeletePaymentDialogProps) {
  const t = useTranslations('sickChildren.payments');
  const tCommon = useTranslations('common');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deletePayment')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('confirmDelete')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {tCommon('deleting') || 'מוחק...'}
              </>
            ) : (
              tCommon('delete')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
