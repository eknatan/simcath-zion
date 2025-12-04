'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import type { CaseWithRelations, Payment } from '@/types/case.types';

// Import refactored components
import {
  useCleaningPayments,
  PaymentForm,
  PaymentsTable,
  EditPaymentDialog,
  DeletePaymentDialog,
} from './cleaning-payments';

interface CleaningPaymentsTabProps {
  caseData: CaseWithRelations;
}

/**
 * CleaningPaymentsTab - Monthly payments management for sick children cases
 *
 * Coordinator component that orchestrates the sub-components.
 * All business logic is delegated to useCleaningPayments hook.
 *
 * SOLID Principles:
 * - S: Only coordinates between components
 * - O: Open for extension (can add more features without changing core)
 * - D: Depends on abstractions (hook interface, not implementation)
 */
export function CleaningPaymentsTab({ caseData }: CleaningPaymentsTabProps) {
  const t = useTranslations('sickChildren.payments');

  // All data and actions from the hook
  const {
    filteredPayments,
    monthlyCap,
    filteredTotal,
    isLoading,
    isSaving,
    isDeleting,
    filterYear,
    setFilterYear,
    addPayment,
    updatePayment,
    deletePayment,
    formatPaymentMonth,
    years,
  } = useCleaningPayments(caseData.id);

  // Local UI state for dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  // Dialog handlers
  const handleOpenEdit = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setEditDialogOpen(true);
  }, []);

  const handleOpenDelete = useCallback((paymentId: string) => {
    setPaymentToDelete(paymentId);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (paymentToDelete) {
      const success = await deletePayment(paymentToDelete);
      if (success) {
        setDeleteDialogOpen(false);
        setPaymentToDelete(null);
      }
    }
  }, [paymentToDelete, deletePayment]);

  const handleCloseEditDialog = useCallback((open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setSelectedPayment(null);
    }
  }, []);

  const handleCloseDeleteDialog = useCallback((open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setPaymentToDelete(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Payment Form */}
      <PaymentForm
        onSubmit={addPayment}
        isSaving={isSaving}
        monthlyCap={monthlyCap}
        years={years}
      />

      {/* Payment History */}
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>{t('history')}</CardTitle>
                <CardDescription>
                  {t('totalYear')}: {formatCurrency(filteredTotal)}
                </CardDescription>
              </div>
            </div>

            {/* Year Filter */}
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('filterByYear')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allYears')}</SelectItem>
                {[...years].reverse().map(year => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <PaymentsTable
            payments={filteredPayments}
            isLoading={isLoading}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            formatPaymentMonth={formatPaymentMonth}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditPaymentDialog
        open={editDialogOpen}
        onOpenChange={handleCloseEditDialog}
        payment={selectedPayment}
        onSave={updatePayment}
        isSaving={isSaving}
        years={years}
        monthlyCap={monthlyCap}
      />

      {/* Delete Dialog */}
      <DeletePaymentDialog
        open={deleteDialogOpen}
        onOpenChange={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
