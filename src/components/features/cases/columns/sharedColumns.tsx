'use client';

import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Case } from '@/types/case.types';

/**
 * Shared column definitions used across different case tables
 */

/** Case number column */
export function createCaseNumberColumn<T extends Pick<Case, 'case_number'>>(
  header: string
): ColumnDef<T> {
  return {
    accessorKey: 'case_number',
    header,
    cell: ({ row }) => (
      <div className="font-semibold text-slate-900">#{row.original.case_number}</div>
    ),
  };
}

/** City column */
export function createCityColumn<T extends Pick<Case, 'city'>>(
  header: string
): ColumnDef<T> {
  return {
    accessorKey: 'city',
    header,
    cell: ({ row }) => (
      <div className="text-slate-700">{row.original.city || '-'}</div>
    ),
  };
}

/** Status column */
export function createStatusColumn<T extends Pick<Case, 'status'>>(
  header: string
): ColumnDef<T> {
  return {
    accessorKey: 'status',
    header,
    cell: ({ row }) => <StatusBadge status={row.original.status as any} />,
  };
}

/** Actions column with view button */
export function createActionsColumn<T extends Pick<Case, 'id'>>(
  header: string,
  viewLabel: string,
  onView: (id: string) => void
): ColumnDef<T> {
  return {
    id: 'actions',
    header,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        onClick={(e) => {
          e.stopPropagation();
          onView(row.original.id);
        }}
      >
        <Eye className="h-4 w-4 me-1" />
        {viewLabel}
      </Button>
    ),
  };
}
