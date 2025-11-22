'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Save,
  Users,
  Phone,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

// Hebrew month names
const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

interface Family {
  id: string;
  case_number: number;
  family_name: string;
  child_name: string;
  contact_phone: string;
  city: string;
  has_payment: boolean;
  existing_payment: {
    amount_ils: number;
    status: string;
  } | null;
}

interface BulkPaymentEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * BulkPaymentEntry - Modal for entering payments for multiple families at once
 *
 * Features:
 * - Select month/year
 * - View all active families
 * - Enter amounts for each family
 * - Bulk save all payments
 *
 * עקרונות SOLID:
 * - Single Responsibility: מנהל רק הזנה מהירה
 * - שימוש בקומפוננטות UI קיימות
 */
export function BulkPaymentEntry({ open, onOpenChange, onSuccess }: BulkPaymentEntryProps) {
  const t = useTranslations('sickChildren.bulkEntry');
  const tPayments = useTranslations('sickChildren.payments');
  const tCommon = useTranslations('common');

  // State
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [monthlyCap, setMonthlyCap] = useState(720);

  // Form state
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(new Set());

  // Generate years for dropdown (2020 to current + 1)
  const years = Array.from(
    { length: new Date().getFullYear() - 2020 + 2 },
    (_, i) => (2020 + i).toString()
  );

  // Fetch families when dialog opens or month changes
  useEffect(() => {
    async function fetchFamilies() {
      setIsLoading(true);
      try {
        const monthStr = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`;
        const response = await fetch(`/api/cleaning-cases/bulk-payments?month=${monthStr}`);

        if (response.ok) {
          const data = await response.json();
          setFamilies(data.families || []);
          setMonthlyCap(data.monthlyCap || 720);

          // Initialize amounts with default cap value for families without payment
          const initialAmounts: Record<string, string> = {};
          const initialSelected = new Set<string>();

          data.families?.forEach((family: Family) => {
            if (!family.has_payment) {
              initialAmounts[family.id] = data.monthlyCap?.toString() || '720';
              initialSelected.add(family.id);
            }
          });

          setAmounts(initialAmounts);
          setSelectedFamilies(initialSelected);
        }
      } catch (error) {
        console.error('Error fetching families:', error);
        toast.error(tCommon('loading'));
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      fetchFamilies();
    }
  }, [open, selectedMonth, selectedYear, tCommon]);

  // Handle amount change for a family
  const handleAmountChange = (familyId: string, value: string) => {
    setAmounts(prev => ({
      ...prev,
      [familyId]: value,
    }));
  };

  // Toggle family selection
  const toggleFamily = (familyId: string) => {
    setSelectedFamilies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(familyId)) {
        newSet.delete(familyId);
      } else {
        newSet.add(familyId);
      }
      return newSet;
    });
  };

  // Select/deselect all families without payment
  const toggleAll = () => {
    const eligibleFamilies = families.filter(f => !f.has_payment);
    if (selectedFamilies.size === eligibleFamilies.length) {
      setSelectedFamilies(new Set());
    } else {
      setSelectedFamilies(new Set(eligibleFamilies.map(f => f.id)));
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    let count = 0;
    let amount = 0;

    selectedFamilies.forEach(familyId => {
      const amountValue = parseFloat(amounts[familyId] || '0');
      if (!isNaN(amountValue) && amountValue > 0) {
        count++;
        amount += amountValue;
      }
    });

    return { count, amount };
  }, [selectedFamilies, amounts]);

  // Handle save
  const handleSave = async () => {
    if (selectedFamilies.size === 0) {
      toast.error(tPayments('fillAllFields'));
      return;
    }

    // Prepare payments array
    const payments = Array.from(selectedFamilies)
      .map(familyId => ({
        case_id: familyId,
        amount_ils: parseFloat(amounts[familyId] || '0'),
      }))
      .filter(p => p.amount_ils > 0);

    if (payments.length === 0) {
      toast.error(tPayments('invalidAmount'));
      return;
    }

    setIsSaving(true);
    try {
      const monthStr = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`;

      const response = await fetch('/api/cleaning-cases/bulk-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_month: monthStr,
          payments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || tPayments('errorSaving'));
        return;
      }

      // Success
      toast.success(
        t('success', {
          count: data.created,
          amount: formatCurrency(data.totalAmount),
        })
      );

      // Close dialog and refresh
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving bulk payments:', error);
      toast.error(tPayments('errorSaving'));
    } finally {
      setIsSaving(false);
    }
  };

  // Families without payment this month
  const eligibleFamilies = families.filter(f => !f.has_payment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {tPayments('cap')}: {formatCurrency(monthlyCap)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Month/Year Selection */}
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{tPayments('month')}</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder={tPayments('selectMonth')} />
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

            <div className="space-y-2">
              <Label>{tPayments('year')}</Label>
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

          {/* Families Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : families.length === 0 ? (
              <div className="text-center p-8 text-slate-500">
                {tPayments('noPayments')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={eligibleFamilies.length > 0 && selectedFamilies.size === eligibleFamilies.length}
                        onCheckedChange={toggleAll}
                        disabled={eligibleFamilies.length === 0}
                      />
                    </TableHead>
                    <TableHead>שם משפחה</TableHead>
                    <TableHead>שם ילד</TableHead>
                    <TableHead>טלפון</TableHead>
                    <TableHead className="w-32">{tPayments('amount')}</TableHead>
                    <TableHead className="w-24">סטטוס</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {families.map((family) => (
                    <TableRow
                      key={family.id}
                      className={family.has_payment ? 'bg-slate-50 opacity-60' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedFamilies.has(family.id)}
                          onCheckedChange={() => toggleFamily(family.id)}
                          disabled={family.has_payment}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {family.family_name}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {family.child_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Phone className="h-3 w-3" />
                          {family.contact_phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {family.has_payment ? (
                          <span className="text-sm text-slate-500">
                            {formatCurrency(family.existing_payment?.amount_ils || 0)}
                          </span>
                        ) : (
                          <Input
                            type="number"
                            value={amounts[family.id] || ''}
                            onChange={(e) => handleAmountChange(family.id, e.target.value)}
                            placeholder={monthlyCap.toString()}
                            min="0"
                            step="0.01"
                            className="h-8 w-full"
                            disabled={!selectedFamilies.has(family.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {family.has_payment ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 me-1" />
                            {t('alreadyReceived')}
                          </Badge>
                        ) : (
                          parseFloat(amounts[family.id] || '0') > monthlyCap && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <AlertTriangle className="h-3 w-3 me-1" />
                              עולה על התקרה
                            </Badge>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Summary */}
          {!isLoading && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-600">
                <span className="font-medium">{t('totalSelected')}:</span> {totals.count} משפחות
              </div>
              <div className="text-sm font-semibold text-emerald-700">
                <span>{t('totalAmount')}:</span> {formatCurrency(totals.amount)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedFamilies.size === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {tCommon('saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 me-2" />
                {tPayments('save')} ({totals.count})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
