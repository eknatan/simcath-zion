'use client';

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
import { ActionButton } from '@/components/shared/ActionButton';
import { useTranslations } from 'next-intl';
import type { BankDetailsFormData } from '@/types/case.types';

interface PaymentApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isApproving: boolean;
  donationIls: string;
  bankDetails: BankDetailsFormData | null;
}

export function PaymentApprovalDialog({
  open,
  onOpenChange,
  onConfirm,
  isApproving,
  donationIls,
  bankDetails
}: PaymentApprovalDialogProps) {
  const t = useTranslations('payments');
  const tc = useTranslations('common');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('approval.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('approval.confirmMessage', {
              amount: donationIls ? `₪${parseFloat(donationIls).toLocaleString('he-IL')}` : '',
              account: bankDetails?.account_holder_name || '',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <ActionButton variant="cancel">
              {tc('cancel')}
            </ActionButton>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <ActionButton
              variant="primary"
              onClick={onConfirm}
              disabled={isApproving}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {isApproving ? tc('saving') : t('approval.confirmButton')}
            </ActionButton>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}