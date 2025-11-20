'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users, Calendar, DollarSign, Plus, Archive, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Case, Payment } from '@/types/case.types';
import { formatCurrency } from '@/lib/utils/format';
import { formatMonthYear, isAfter15thOfMonth } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';

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

  // Fetch cases with current month payment
  useEffect(() => {
    async function fetchCasesWithPayments() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/cleaning-cases?status=active');
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
  }, []);

  // Filter cases by search term
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    if (!searchTerm) return cases;

    const term = searchTerm.toLowerCase();
    return cases.filter((caseItem) => {
      return (
        caseItem.family_name?.toLowerCase().includes(term) ||
        caseItem.child_name?.toLowerCase().includes(term) ||
        caseItem.city?.toLowerCase().includes(term) ||
        caseItem.case_number.toString().includes(term)
      );
    });
  }, [cases, searchTerm]);

  // Check if should highlight row (after 15th and no payment)
  const shouldHighlightRow = (caseItem: CleaningCaseWithPayment): boolean => {
    const isAfter15 = isAfter15thOfMonth();
    const hasPayment = !!caseItem.current_month_payment;
    return isAfter15 && !hasPayment;
  };

  // Define table columns
  const columns: ColumnDef<CleaningCaseWithPayment>[] = useMemo(
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

  const handleRowClick = (caseItem: CleaningCaseWithPayment) => {
    router.push(`/cases/${caseItem.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="default"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            // TODO: Open bulk payment modal
            console.log('Open bulk payment entry');
          }}
        >
          <Plus className="h-4 w-4 me-2" />
          {tCleaning('dashboard.bulkEntry')}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push('/cases/inactive')}
        >
          <Archive className="h-4 w-4 me-2" />
          {tCleaning('dashboard.inactiveFamilies')}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            // TODO: Open send emails modal
            console.log('Open send emails flow');
          }}
        >
          <Mail className="h-4 w-4 me-2" />
          {tCleaning('dashboard.sendEmails')}
        </Button>
      </div>

      {/* Search */}
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
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCases}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        rowClassName={(row) =>
          shouldHighlightRow(row)
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
    </div>
  );
}
