'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Save,
  Trash2,
  Pencil,
  AlertTriangle,
  Loader2,
  Calendar,
  Banknote
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/utils/format';
import type { CaseWithRelations, Payment } from '@/types/case.types';

interface CleaningPaymentsTabProps {
  caseData: CaseWithRelations;
}

// Hebrew month names
const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

/**
 * CleaningPaymentsTab - Monthly payments management for sick children cases
 *
 * Features:
 * - Add new monthly payment
 * - View payment history
 * - Edit/delete pending payments
 * - Warnings for over-cap and duplicate payments
 *
 * עקרונות SOLID:
 * - Single Responsibility: מנהל רק תשלומים חודשיים
 */
export function CleaningPaymentsTab({ caseData }: CleaningPaymentsTabProps) {
  const t = useTranslations('sickChildren.payments');
  const tCommon = useTranslations('common');

  // State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [monthlyCap, setMonthlyCap] = useState(720);

  // Form state
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Filter state
  const [filterYear, setFilterYear] = useState<string>('all');

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [showCapWarning, setShowCapWarning] = useState(false);

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [editMonth, setEditMonth] = useState<string>('');
  const [editYear, setEditYear] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Generate years for dropdown (2020 to current + 1)
  const years = Array.from(
    { length: new Date().getFullYear() - 2020 + 2 },
    (_, i) => (2020 + i).toString()
  );

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cleaning-cases/${caseData.id}/payments`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setMonthlyCap(data.summary?.monthlyCap || 720);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(t('errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, [caseData.id, t]);

  // Fetch payments on mount
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Handle amount change with cap warning
  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numValue = parseFloat(value);
    setShowCapWarning(!isNaN(numValue) && numValue > monthlyCap);
  };

  // Handle save payment
  const handleSavePayment = async () => {
    if (!selectedMonth || !selectedYear || !amount) {
      toast.error(t('fillAllFields'));
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(t('invalidAmount'));
      return;
    }

    setIsSaving(true);
    try {
      const paymentMonth = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`;

      const response = await fetch(`/api/cleaning-cases/${caseData.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_month: paymentMonth,
          amount_ils: numAmount,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error(t('duplicateMonth', { month: HEBREW_MONTHS[parseInt(selectedMonth) - 1], year: selectedYear }));
        } else {
          const errorMsg = data.error || t('errorSaving');
          const details = data.details ? ` (${data.details})` : '';
          toast.error(`${errorMsg}${details}`);
        }
        return;
      }

      // Success
      toast.success(t('paymentSaved'));

      // Reset form
      setSelectedMonth('');
      setAmount('');
      setNotes('');
      setShowCapWarning(false);

      // Refresh payments
      fetchPayments();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error(t('errorSaving'));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete payment
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      const response = await fetch(
        `/api/cleaning-cases/${caseData.id}/payments?paymentId=${paymentToDelete}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success(t('paymentDeleted'));
        fetchPayments();
      } else {
        const data = await response.json();
        toast.error(data.error || t('errorDeleting'));
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error(t('errorDeleting'));
    } finally {
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  // Open edit dialog
  const handleOpenEditDialog = (payment: Payment) => {
    const date = new Date(payment.payment_month!);
    setPaymentToEdit(payment);
    setEditMonth((date.getMonth() + 1).toString());
    setEditYear(date.getFullYear().toString());
    setEditAmount(payment.amount_ils?.toString() || '');
    setEditNotes(payment.notes || '');
    setEditDialogOpen(true);
  };

  // Handle edit payment
  const handleEditPayment = async () => {
    if (!paymentToEdit || !editMonth || !editYear || !editAmount) {
      toast.error(t('fillAllFields'));
      return;
    }

    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(t('invalidAmount'));
      return;
    }

    setIsEditing(true);
    try {
      const paymentMonth = `${editYear}-${editMonth.padStart(2, '0')}-01`;

      const response = await fetch(
        `/api/cleaning-cases/${caseData.id}/payments?paymentId=${paymentToEdit.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_month: paymentMonth,
            amount_ils: numAmount,
            notes: editNotes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error(t('duplicateMonth', { month: HEBREW_MONTHS[parseInt(editMonth) - 1], year: editYear }));
        } else {
          toast.error(data.error || t('errorUpdating'));
        }
        return;
      }

      toast.success(t('paymentUpdated'));
      setEditDialogOpen(false);
      setPaymentToEdit(null);
      fetchPayments();
    } catch (error) {
      console.error('Error editing payment:', error);
      toast.error(t('errorUpdating'));
    } finally {
      setIsEditing(false);
    }
  };

  // Filter payments by year
  const filteredPayments = filterYear === 'all'
    ? payments
    : payments.filter(p => {
        const paymentYear = new Date(p.payment_month!).getFullYear().toString();
        return paymentYear === filterYear;
      });

  // Calculate total for filtered payments
  const filteredTotal = filteredPayments.reduce((sum, p) => sum + (p.amount_ils || 0), 0);

  // Format month display
  const formatPaymentMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${HEBREW_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      {/* New Payment Form */}
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
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectMonth')} />
                </SelectTrigger>
                <SelectContent>
                  {HEBREW_MONTHS.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Select */}
            <div className="space-y-2">
              <Label>{t('year')}</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
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
              placeholder="הערות אופציונליות..."
              rows={2}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSavePayment}
            disabled={isSaving || !selectedMonth || !amount}
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
                {years.reverse().map(year => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center p-8 text-slate-500">
              {t('noPayments')}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>{t('month')}</TableHead>
                    <TableHead>{t('amount')}</TableHead>
                    <TableHead>{t('entryDate')}</TableHead>
                    <TableHead>{tCommon('status')}</TableHead>
                    <TableHead className="text-left">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {formatPaymentMonth(payment.payment_month!)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-emerald-700">
                          {formatCurrency(payment.amount_ils)}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {payment.created_at ? new Date(payment.created_at).toLocaleDateString('he-IL') : '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status as any} />
                      </TableCell>
                      <TableCell>
                        {payment.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-slate-700"
                              onClick={() => handleOpenEditDialog(payment)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-700"
                              onClick={() => {
                                setPaymentToDelete(payment.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deletePayment')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Payment Dialog */}
      <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
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
                <Select value={editMonth} onValueChange={setEditMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectMonth')} />
                  </SelectTrigger>
                  <SelectContent>
                    {HEBREW_MONTHS.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Select */}
              <div className="space-y-2">
                <Label>{t('year')}</Label>
                <Select value={editYear} onValueChange={setEditYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
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
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="720"
                min="0"
                step="0.01"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{t('notes')}</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="הערות אופציונליות..."
                rows={2}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEditing}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEditPayment}
              disabled={isEditing || !editMonth || !editYear || !editAmount}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isEditing ? (
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
    </div>
  );
}
