'use client';

import { useState, useMemo, useCallback } from 'react';

// ========================================
// Types
// ========================================

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

export interface FilterConfig {
  id: string;
  value: string;
}

export interface UseTableFiltersOptions<T> {
  /** The data array to filter and sort */
  data: T[];
  /** Fields to search in (for text search) */
  searchFields: (keyof T)[];
  /** Default sort configuration */
  defaultSort?: SortConfig<T>;
  /** Status field name for filtering active/history */
  statusField?: keyof T;
  /** Statuses considered "active" (shown by default) */
  activeStatuses?: string[];
  /** Statuses considered "history" (shown when history mode is on) */
  historyStatuses?: string[];
}

export interface UseTableFiltersReturn<T> {
  // Filtered & sorted data
  filteredData: T[];

  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Sort
  sortField: keyof T | null;
  sortDirection: SortDirection;
  setSortField: (field: keyof T) => void;
  toggleSortDirection: () => void;

  // History mode
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  toggleHistory: () => void;

  // Custom filters
  filters: Record<string, string>;
  setFilter: (id: string, value: string) => void;
  clearFilters: () => void;

  // Counts
  totalCount: number;
  filteredCount: number;
}

// ========================================
// Hook Implementation
// ========================================

export function useTableFilters<T extends Record<string, any>>({
  data,
  searchFields,
  defaultSort,
  statusField = 'status' as keyof T,
  activeStatuses = [],
  historyStatuses = [],
}: UseTableFiltersOptions<T>): UseTableFiltersReturn<T> {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortFieldState] = useState<keyof T | null>(defaultSort?.field ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSort?.direction ?? 'asc');
  const [showHistory, setShowHistory] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Set sort field
  const setSortField = useCallback((field: keyof T) => {
    setSortFieldState(field);
  }, []);

  // Toggle sort direction
  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  // Toggle history mode
  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
    // Clear filters when switching modes
    setFilters({});
    setSearchTerm('');
  }, []);

  // Set a custom filter
  const setFilter = useCallback((id: string, value: string) => {
    setFilters((prev) => ({ ...prev, [id]: value }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!data) return [];

    let result = [...data];

    // 1. Filter by active/history status
    if (activeStatuses.length > 0 || historyStatuses.length > 0) {
      const statusesToShow = showHistory ? historyStatuses : activeStatuses;
      if (statusesToShow.length > 0) {
        result = result.filter((item) => {
          const status = item[statusField];
          return statusesToShow.includes(String(status));
        });
      }
    }

    // 2. Apply custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter((item) => {
          const itemValue = item[key as keyof T];
          return String(itemValue) === value;
        });
      }
    });

    // 3. Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (value == null) return false;
          return String(value).toLowerCase().includes(term);
        })
      );
    }

    // 4. Sort
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        // Handle null/undefined
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
        if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

        // Handle dates
        const isDateLike = (val: unknown): boolean => {
          if (val instanceof Date) return true;
          if (typeof val === 'string' && !isNaN(Date.parse(val))) return true;
          return false;
        };

        if (isDateLike(aValue)) {
          const dateA = new Date(aValue as string | Date).getTime();
          const dateB = new Date(bValue as string | Date).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // Handle numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle strings
        const strA = String(aValue).toLowerCase();
        const strB = String(bValue).toLowerCase();
        const comparison = strA.localeCompare(strB);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, searchFields, sortField, sortDirection, showHistory, filters, statusField, activeStatuses, historyStatuses]);

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDirection,
    setSortField,
    toggleSortDirection,
    showHistory,
    setShowHistory,
    toggleHistory,
    filters,
    setFilter,
    clearFilters,
    totalCount: data?.length ?? 0,
    filteredCount: filteredData.length,
  };
}
