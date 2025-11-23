'use client';

import { useState, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ActionButton } from '@/components/shared/ActionButton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Heart, Users, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Case } from '@/types/case.types';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { formatHebrewDateForDisplay } from '@/lib/utils/hebrew-date-parser';

/**
 * Format Hebrew date from structured fields
 */
function formatHebrewDate(day: number | null | undefined, month: number | null | undefined, year: number | null | undefined): string | null {
  if (!day || !month || !year) return null;
  return formatHebrewDateForDisplay(day, month, year, 'he');
}

interface CasesListProps {
  cases: Case[];
}

/**
 * CasesList - Display table of cases with filtering and search
 */
export function CasesList({ cases }: CasesListProps) {
  const t = useTranslations('cases');
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter cases by search term
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    if (!searchTerm) return cases;

    const term = searchTerm.toLowerCase();
    return cases.filter((caseItem) => {
      // Wedding: search by groom/bride name, city
      if (caseItem.case_type === 'wedding') {
        return (
          caseItem.groom_first_name?.toLowerCase().includes(term) ||
          caseItem.groom_last_name?.toLowerCase().includes(term) ||
          caseItem.bride_first_name?.toLowerCase().includes(term) ||
          caseItem.bride_last_name?.toLowerCase().includes(term) ||
          caseItem.city?.toLowerCase().includes(term) ||
          caseItem.case_number.toString().includes(term)
        );
      }
      // Cleaning: search by family name, child name, city
      else {
        return (
          caseItem.family_name?.toLowerCase().includes(term) ||
          caseItem.child_name?.toLowerCase().includes(term) ||
          caseItem.city?.toLowerCase().includes(term) ||
          caseItem.case_number.toString().includes(term)
        );
      }
    });
  }, [cases, searchTerm]);

  // Define table columns
  const columns: ColumnDef<Case>[] = useMemo(
    () => [
      {
        accessorKey: 'case_number',
        header: t('table.caseNumber'),
        cell: ({ row }) => (
          <div className="font-semibold text-slate-900">#{row.original.case_number}</div>
        ),
      },
      {
        accessorKey: 'case_type',
        header: t('table.type'),
        cell: ({ row }) => {
          const isWedding = row.original.case_type === 'wedding';
          return (
            <Badge
              variant="outline"
              className={
                isWedding
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }
            >
              {isWedding ? (
                <>
                  <Heart className="h-3 w-3 me-1" />
                  {t('type.wedding')}
                </>
              ) : (
                <>
                  <Users className="h-3 w-3 me-1" />
                  {t('type.cleaning')}
                </>
              )}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'names',
        header: t('table.names'),
        cell: ({ row }) => {
          if (row.original.case_type === 'wedding') {
            return (
              <div>
                <div className="font-medium text-slate-900">
                  {row.original.groom_first_name} {row.original.groom_last_name}
                </div>
                <div className="text-sm text-slate-600">
                  {row.original.bride_first_name} {row.original.bride_last_name}
                </div>
              </div>
            );
          } else {
            return (
              <div>
                <div className="font-medium text-slate-900">{row.original.family_name}</div>
                {row.original.child_name && (
                  <div className="text-sm text-slate-600">{row.original.child_name}</div>
                )}
              </div>
            );
          }
        },
      },
      {
        accessorKey: 'city',
        header: t('table.city'),
        cell: ({ row }) => <div className="text-slate-700">{row.original.city || '-'}</div>,
      },
      {
        accessorKey: 'date',
        header: t('table.date'),
        cell: ({ row }) => {
          if (row.original.case_type === 'wedding' && row.original.wedding_date_gregorian) {
            const hebrewDateStr = formatHebrewDate(
              row.original.hebrew_day,
              row.original.hebrew_month,
              row.original.hebrew_year
            ) || row.original.wedding_date_hebrew;

            return (
              <div className="text-sm">
                <div className="font-medium text-slate-900">
                  {formatDate(row.original.wedding_date_gregorian)}
                </div>
                {hebrewDateStr && (
                  <div className="text-slate-600">{hebrewDateStr}</div>
                )}
              </div>
            );
          } else if (row.original.case_type === 'cleaning' && row.original.start_date) {
            return (
              <div className="text-sm text-slate-700">{formatDate(row.original.start_date)}</div>
            );
          }
          return <div className="text-slate-500">-</div>;
        },
      },
      {
        accessorKey: 'amount',
        header: t('table.amount'),
        cell: ({ row }) => {
          if (row.original.total_cost) {
            return (
              <div className="font-semibold text-emerald-700">
                {formatCurrency(row.original.total_cost)}
              </div>
            );
          }
          return <div className="text-slate-500">-</div>;
        },
      },
      {
        accessorKey: 'status',
        header: t('table.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status as any} />,
      },
      {
        accessorKey: 'created_at',
        header: t('table.createdAt'),
        cell: ({ row }) =>
          row.original.created_at ? (
            <div className="text-sm text-slate-600">{formatDate(row.original.created_at)}</div>
          ) : (
            '-'
          ),
      },
      {
        id: 'actions',
        header: t('table.actions'),
        cell: ({ row }) => (
          <ActionButton
            variant="view"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/cases/${row.original.id}`);
            }}
          >
            <Eye className="h-4 w-4 me-1" />
            {t('actions.view')}
          </ActionButton>
        ),
      },
    ],
    [t, router]
  );

  const handleRowClick = (caseItem: Case) => {
    router.push(`/cases/${caseItem.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pe-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredCases} onRowClick={handleRowClick} />

      {/* Results count */}
      {filteredCases && (
        <div className="text-sm text-slate-600">
          {t('resultsCount', { count: filteredCases.length })}
        </div>
      )}
    </div>
  );
}
