'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users, Calendar, DollarSign, Plus, Archive, Mail, CalendarX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Case, Payment } from '@/types/case.types';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { formatMonthYear, isAfter15thOfMonth } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { BulkPaymentEntry } from './BulkPaymentEntry';
import { SendEmailsFlow } from './SendEmailsFlow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CleaningCaseWithPayment extends Case {
  current_month_payment?: Payment | null;
}

interface CleaningCasesDashboardProps {
  cases: CleaningCaseWithPayment[];
}

/**
 * CleaningCasesDashboard - Specialized dashboard for sick children cases
 *
 * Features:
 * - Current month payment display
 * - Visual indicator for missing payments after 15th of month
 * - Search by family name, child name, city
 * - Status filtering
 */
export function CleaningCasesDashboard({ cases: initialCases }: CleaningCasesDashboardProps) {
  const t = useTranslations('cases');
  const tCleaning = useTranslations('sickChildren');
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState<CleaningCaseWithPayment[]>(initialCases);
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkEntry, setShowBulkEntry] = useState(false);
  const [showSendEmails, setShowSendEmails] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [endReasonFilter, setEndReasonFilter] = useState<string>('all');

  // Fetch cases with current month payment
  useEffect(() => {
    async function fetchCasesWithPayments() {
      setIsLoading(true);
      try {
        const status = showInactive ? 'inactive' : 'active';
        const response = await fetch(`/api/cleaning-cases?status=${status}`);
        if (response.ok) {
          const data = await response.json();
          setCases(data);
        }
      } catch (error) {
        console.error('Error fetching cleaning cases:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCasesWithPayments();
  }, [showInactive]);

  // Filter cases by search term and end reason
  const filteredCases = useMemo(() => {
    if (!cases) return [];

    let filtered = cases;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((caseItem) => {
        return (
          caseItem.family_name?.toLowerCase().includes(term) ||
          caseItem.child_name?.toLowerCase().includes(term) ||
          caseItem.city?.toLowerCase().includes(term) ||
          caseItem.case_number.toString().includes(term)
        );
      });
    }

    // Filter by end reason (only for inactive)
    if (showInactive && endReasonFilter !== 'all') {
      filtered = filtered.filter((caseItem) => caseItem.end_reason === endReasonFilter);
    }

    return filtered;
  }, [cases, searchTerm, showInactive, endReasonFilter]);

  // Check if should highlight row (after 15th and no payment)
  const shouldHighlightRow = (caseItem: CleaningCaseWithPayment): boolean => {
    const isAfter15 = isAfter15thOfMonth();
    const hasPayment = !!caseItem.current_month_payment;
    return isAfter15 && !hasPayment;
  };

  // Define table columns for active families
  const activeColumns: ColumnDef<CleaningCaseWithPayment>[] = useMemo(
    () => [
      {
        accessorKey: 'case_number',
        header: t('table.caseNumber'),
        cell: ({ row }) => (
          <div className="font-semibold text-slate-900">#{row.original.case_number}</div>
        ),
      },
      {
        accessorKey: 'family_name',
        header: tCleaning('dashboard.familyName'),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-900">{row.original.family_name}</div>
            {row.original.child_name && (
              <div className="text-sm text-slate-600 flex items-center gap-1 mt-0.5">
                <Users className="h-3 w-3" />
                {row.original.child_name}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'city',
        header: t('table.city'),
        cell: ({ row }) => <div className="text-slate-700">{row.original.city || '-'}</div>,
      },
      {
        accessorKey: 'start_date',
        header: tCleaning('dashboard.startDate'),
        cell: ({ row }) => {
          if (row.original.start_date) {
            return (
              <div className="text-sm text-slate-700 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatMonthYear(row.original.start_date)}
              </div>
            );
          }
          return <div className="text-slate-500">-</div>;
        },
      },
      {
        accessorKey: 'current_month_payment',
        header: tCleaning('dashboard.currentMonthPayment'),
        cell: ({ row }) => {
          const payment = row.original.current_month_payment;
          if (payment) {
            return (
              <div className="flex items-center gap-2">
                <div className="font-semibold text-emerald-700 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(payment.amount_ils)}
                </div>
              </div>
            );
          }
          return <div className="text-slate-500">-</div>;
        },
      },
      {
        accessorKey: 'payment_status',
        header: tCleaning('dashboard.paymentStatus'),
        cell: ({ row }) => {
          const payment = row.original.current_month_payment;
          if (payment) {
            return <StatusBadge status={payment.status as any} />;
          }

          // No payment - show warning if after 15th
          if (shouldHighlightRow(row.original)) {
            return (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {tCleaning('dashboard.missingPayment')}
              </Badge>
            );
          }

          return (
            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
              {tCleaning('dashboard.noPayment')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('table.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status as any} />,
      },
    ],
    [t, tCleaning]
  );

  // Define table columns for inactive families
  const inactiveColumns: ColumnDef<CleaningCaseWithPayment>[] = useMemo(
    () => [
      {
        accessorKey: 'case_number',
        header: t('table.caseNumber'),
        cell: ({ row }) => (
          <div className="font-semibold text-slate-900">#{row.original.case_number}</div>
        ),
      },
      {
        accessorKey: 'family_name',
        header: tCleaning('dashboard.familyName'),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-900">{row.original.family_name}</div>
            {row.original.child_name && (
              <div className="text-sm text-slate-600 flex items-center gap-1 mt-0.5">
                <Users className="h-3 w-3" />
                {row.original.child_name}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'city',
        header: t('table.city'),
        cell: ({ row }) => <div className="text-slate-700">{row.original.city || '-'}</div>,
      },
      {
        accessorKey: 'start_date',
        header: tCleaning('dashboard.startDate'),
        cell: ({ row }) => {
          if (row.original.start_date) {
            return (
              <div className="text-sm text-slate-700 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatMonthYear(row.original.start_date)}
              </div>
            );
          }
          return <div className="text-slate-500">-</div>;
        },
      },
      {
        accessorKey: 'end_date',
        header: tCleaning('dashboard.endDate'),
        cell: ({ row }) => {
          if (row.original.end_date) {
            return (
              <div className="text-sm text-slate-700 flex items-center gap-1">
                <CalendarX className="h-3 w-3" />
                {formatDate(row.original.end_date)}
              </div>
            );
          }
          return <div className="text-slate-500">-</div>;
        },
      },
      {
        accessorKey: 'end_reason',
        header: tCleaning('dashboard.endReason'),
        cell: ({ row }) => {
          const reason = row.original.end_reason;
          if (!reason) return <div className="text-slate-500">-</div>;

          const variants: Record<string, string> = {
            healed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            deceased: 'bg-slate-100 text-slate-700 border-slate-300',
            other: 'bg-amber-50 text-amber-700 border-amber-200',
          };

          return (
            <Badge variant="outline" className={variants[reason] || ''}>
              {tCleaning(`inactiveFamilies.reasons.${reason}`)}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('table.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status as any} />,
      },
    ],
    [t, tCleaning]
  );

  // Select columns based on view mode
  const columns = showInactive ? inactiveColumns : activeColumns;

  const handleRowClick = (caseItem: CleaningCaseWithPayment) => {
    router.push(`/cases/${caseItem.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {!showInactive && (
          <>
            <Button
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setShowBulkEntry(true)}
            >
              <Plus className="h-4 w-4 me-2" />
              {tCleaning('dashboard.bulkEntry')}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowSendEmails(true)}
            >
              <Mail className="h-4 w-4 me-2" />
              {tCleaning('dashboard.sendEmails')}
            </Button>
          </>
        )}

        <Button
          variant={showInactive ? 'default' : 'outline'}
          className={showInactive ? 'bg-slate-700 hover:bg-slate-800' : ''}
          onClick={() => {
            setShowInactive(!showInactive);
            setEndReasonFilter('all');
            setSearchTerm('');
          }}
        >
          <Archive className="h-4 w-4 me-2" />
          {tCleaning('dashboard.inactiveFamilies')}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder={tCleaning('dashboard.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pe-10"
          />
        </div>

        {/* End reason filter - only for inactive */}
        {showInactive && (
          <Select value={endReasonFilter} onValueChange={setEndReasonFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={tCleaning('dashboard.filterByReason')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCleaning('dashboard.allReasons')}</SelectItem>
              <SelectItem value="healed">{tCleaning('inactiveFamilies.reasons.healed')}</SelectItem>
              <SelectItem value="deceased">{tCleaning('inactiveFamilies.reasons.deceased')}</SelectItem>
              <SelectItem value="other">{tCleaning('inactiveFamilies.reasons.other')}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCases}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        rowClassName={(row) =>
          !showInactive && shouldHighlightRow(row)
            ? 'bg-red-50 hover:bg-red-100 cursor-pointer'
            : 'cursor-pointer hover:bg-muted'
        }
      />

      {/* Results count */}
      {filteredCases && (
        <div className="text-sm text-slate-600">
          {t('resultsCount', { count: filteredCases.length })}
        </div>
      )}

      {/* Bulk Payment Entry Modal */}
      <BulkPaymentEntry
        open={showBulkEntry}
        onOpenChange={setShowBulkEntry}
        onSuccess={() => {
          // Refresh the cases list after successful bulk entry
          setIsLoading(true);
          fetch('/api/cleaning-cases?status=active')
            .then(res => res.json())
            .then(data => setCases(data))
            .finally(() => setIsLoading(false));
        }}
      />

      {/* Send Emails Flow Modal */}
      <SendEmailsFlow
        open={showSendEmails}
        onOpenChange={setShowSendEmails}
        onSuccess={() => {
          // Optional: refresh data after sending emails
        }}
      />
    </div>
  );
}
