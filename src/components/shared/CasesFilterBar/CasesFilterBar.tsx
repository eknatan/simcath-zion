'use client';

import { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { History, Calendar, Clock } from 'lucide-react';

// ========================================
// Types
// ========================================

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  /** Only show this filter when condition is true */
  showWhen?: boolean;
}

export interface SortOption {
  value: string;
  label: string;
  icon?: 'calendar' | 'clock';
}

export interface ActionButton {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  /** Only show this button when condition is true */
  showWhen?: boolean;
}

export interface CasesFilterBarProps {
  // Search
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder: string;

  // Filters (optional)
  filters?: FilterConfig[];

  // Sort toggle (optional)
  sortOptions?: SortOption[];
  currentSort?: string;
  onSortChange?: (sort: string) => void;

  // Action buttons (optional)
  actions?: ActionButton[];

  // History toggle (optional)
  showHistoryToggle?: boolean;
  historyLabel?: string;
  isHistoryMode?: boolean;
  onHistoryToggle?: () => void;
}

// ========================================
// Component
// ========================================

export function CasesFilterBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  sortOptions,
  currentSort,
  onSortChange,
  actions = [],
  showHistoryToggle = false,
  historyLabel = 'History',
  isHistoryMode = false,
  onHistoryToggle,
}: CasesFilterBarProps) {
  const getSortIcon = (icon?: 'calendar' | 'clock') => {
    switch (icon) {
      case 'calendar':
        return <Calendar className="h-4 w-4 me-1" />;
      case 'clock':
        return <Clock className="h-4 w-4 me-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filters */}
      {filters.map((filter) => {
        // Skip if showWhen is explicitly false
        if (filter.showWhen === false) return null;

        return (
          <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}

      {/* Sort Toggle */}
      {sortOptions && sortOptions.length > 0 && onSortChange && (
        <div className="flex items-center rounded-lg border border-slate-200 p-1 bg-slate-100">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              size="sm"
              className={`h-8 px-3 transition-all ${
                currentSort === option.value
                  ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              onClick={() => onSortChange(option.value)}
            >
              {getSortIcon(option.icon)}
              {option.label}
            </Button>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {actions.map((action) => {
        // Skip if showWhen is explicitly false
        if (action.showWhen === false) return null;

        return (
          <Button
            key={action.id}
            variant={action.variant || 'outline'}
            className={action.className}
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        );
      })}

      {/* History Toggle */}
      {showHistoryToggle && onHistoryToggle && (
        <Button
          variant={isHistoryMode ? 'default' : 'outline'}
          className={isHistoryMode ? 'bg-slate-700 hover:bg-slate-800' : ''}
          onClick={onHistoryToggle}
        >
          <History className="h-4 w-4 me-2" />
          {historyLabel}
        </Button>
      )}
    </div>
  );
}
