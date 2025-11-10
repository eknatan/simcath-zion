/**
 * Custom Hook: useTransferSelection
 *
 * ניהול selection של העברות בטבלה
 *
 * Features:
 * - Single selection
 * - Multiple selection
 * - Select all / Deselect all
 * - Toggle selection
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { TransferWithDetails } from '@/types/transfers.types';

// ========================================
// Types
// ========================================

interface UseTransferSelectionReturn {
  // State
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  selectedCount: number;
  selectedTransfers: TransferWithDetails[];

  // Actions
  toggleSelection: (id: string) => void;
  toggleAll: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  setSelectedIds: (ids: string[]) => void;
}

// ========================================
// Hook
// ========================================

export function useTransferSelection(
  transfers: TransferWithDetails[]
): UseTransferSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ========================================
  // Computed Values
  // ========================================

  const isSelected = useCallback(
    (id: string): boolean => {
      return selectedIds.includes(id);
    },
    [selectedIds]
  );

  const isAllSelected = useMemo(() => {
    if (transfers.length === 0) return false;
    return transfers.every((transfer) => selectedIds.includes(transfer.id));
  }, [transfers, selectedIds]);

  const selectedCount = selectedIds.length;

  const selectedTransfers = useMemo(() => {
    return transfers.filter((transfer) => selectedIds.includes(transfer.id));
  }, [transfers, selectedIds]);

  // ========================================
  // Actions
  // ========================================

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transfers.map((t) => t.id));
    }
  }, [isAllSelected, transfers]);

  const selectAll = useCallback(() => {
    setSelectedIds(transfers.map((t) => t.id));
  }, [transfers]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    // State
    selectedIds,
    isSelected,
    isAllSelected,
    selectedCount,
    selectedTransfers,

    // Actions
    toggleSelection,
    toggleAll,
    selectAll,
    deselectAll,
    setSelectedIds,
  };
}
