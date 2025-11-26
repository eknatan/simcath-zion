'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { DataTable } from '@/components/shared/DataTable';
import { CasesFilterBar, FilterConfig, SortOption } from '@/components/shared/CasesFilterBar';
import { useTranslations } from 'next-intl';
import { CaseForTable, WeddingCaseStatus } from '@/types/case.types';
import { useTableFilters } from '@/lib/hooks/useTableFilters';
import { createWeddingCasesColumns, WeddingColumnsTranslations } from '@/components/features/cases/columns';

// ========================================
// Types
// ========================================

interface WeddingCasesListProps {
  cases: CaseForTable[];
}

// ========================================
// Constants
// ========================================

const ACTIVE_STATUSES = [WeddingCaseStatus.NEW, WeddingCaseStatus.PENDING_TRANSFER];
const HISTORY_STATUSES = [WeddingCaseStatus.TRANSFERRED, WeddingCaseStatus.REJECTED, WeddingCaseStatus.EXPIRED];

const SEARCH_FIELDS: (keyof CaseForTable)[] = [
  'groom_first_name',
  'groom_last_name',
  'bride_first_name',
  'bride_last_name',
  'city',
  'case_number',
];

// ========================================
// Component
// ========================================

export function WeddingCasesList({ cases }: WeddingCasesListProps) {
  const t = useTranslations('cases');
  const tWedding = useTranslations('weddingCases');
  const router = useRouter();

  // Use table filters hook
  const {
    filteredData,
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    showHistory,
    toggleHistory,
    filters,
    setFilter,
  } = useTableFilters({
    data: cases,
    searchFields: SEARCH_FIELDS,
    defaultSort: { field: 'wedding_date_gregorian', direction: 'asc' },
    statusField: 'status',
    activeStatuses: ACTIVE_STATUSES,
    historyStatuses: HISTORY_STATUSES,
  });

  // Navigation handler
  const handleViewCase = useCallback((id: string) => {
    router.push(`/cases/${id}`);
  }, [router]);

  const handleRowClick = useCallback((caseItem: CaseForTable) => {
    router.push(`/cases/${caseItem.id}`);
  }, [router]);

  // Sort the filtered data by the selected sort field
  const sortedData = useMemo(() => {
    const currentSortField = sortField || 'wedding_date_gregorian';

    return [...filteredData].sort((a, b) => {
      if (currentSortField === 'wedding_date_gregorian') {
        const dateA = a.wedding_date_gregorian
          ? new Date(a.wedding_date_gregorian).getTime()
          : Infinity;
        const dateB = b.wedding_date_gregorian
          ? new Date(b.wedding_date_gregorian).getTime()
          : Infinity;
        return dateA - dateB;
      } else if (currentSortField === 'created_at') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [filteredData, sortField]);

  // Column translations
  const columnTranslations: WeddingColumnsTranslations = useMemo(() => ({
    caseNumber: t('table.caseNumber'),
    names: t('table.names'),
    weddingDate: tWedding('table.weddingDate'),
    city: t('table.city'),
    requestedAmount: tWedding('table.requestedAmount'),
    approvedAmount: tWedding('table.approvedAmount'),
    notApproved: tWedding('table.notApproved'),
    bankDetails: tWedding('table.bankDetails'),
    files: tWedding('table.files'),
    status: t('table.status'),
    actions: t('table.actions'),
    viewAction: t('actions.view'),
  }), [t, tWedding]);

  // Create columns
  const columns = useMemo(
    () => createWeddingCasesColumns(columnTranslations, handleViewCase),
    [columnTranslations, handleViewCase]
  );

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      id: 'status',
      placeholder: tWedding('filters.status'),
      value: filters.status || 'all',
      onChange: (value) => setFilter('status', value),
      showWhen: !showHistory,
      options: [
        { value: 'all', label: tWedding('filters.allStatuses') },
        { value: WeddingCaseStatus.NEW, label: tWedding('filters.new') },
        { value: WeddingCaseStatus.PENDING_TRANSFER, label: tWedding('filters.pendingTransfer') },
      ],
    },
  ], [tWedding, filters.status, setFilter, showHistory]);

  // Sort options
  const sortOptions: SortOption[] = useMemo(() => [
    {
      value: 'wedding_date_gregorian',
      label: tWedding('filters.sortByWeddingDate'),
      icon: 'calendar',
    },
    {
      value: 'created_at',
      label: tWedding('filters.sortByCreatedAt'),
      icon: 'clock',
    },
  ], [tWedding]);

  // Current sort value
  const currentSort = (sortField as string) || 'wedding_date_gregorian';

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <CasesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('searchPlaceholder')}
        filters={filterConfigs}
        sortOptions={sortOptions}
        currentSort={currentSort}
        onSortChange={(value) => setSortField(value as keyof CaseForTable)}
        showHistoryToggle
        historyLabel={tWedding('filters.history')}
        isHistoryMode={showHistory}
        onHistoryToggle={toggleHistory}
      />

      {/* Table */}
      <DataTable columns={columns} data={sortedData} onRowClick={handleRowClick} />

      {/* Results count */}
      <div className="text-sm text-slate-600">
        {t('resultsCount', { count: sortedData.length })}
      </div>
    </div>
  );
}
