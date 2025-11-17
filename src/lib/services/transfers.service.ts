/**
 * Transfers Service
 *
 * Handles all database operations for bank transfers module.
 * Features:
 * - Fetch pending transfers (approved payments not yet transferred)
 * - Filter by payment type (wedding/cleaning)
 * - Update transfer status after export
 * - Record export history
 */

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import {
  Transfer,
  TransferWithDetails,
  WeddingTransfer,
  CleaningTransfer,
  TransferFilters,
  TransferSummary,
  BulkUpdateData,
} from '@/types/transfers.types';
import { PaymentType, PaymentStatus } from '@/types/case.types';

// ========================================
// Error Types
// ========================================

export class TransferError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TransferError';
  }
}

// ========================================
// Fetch Transfers
// ========================================

/**
 * Fetch pending transfers (approved payments not yet transferred)
 */
export async function fetchPendingTransfers(
  paymentType: PaymentType,
  filters?: TransferFilters
) {
  const supabase = createClient();
  try {
    let query = supabase
      .from('payments')
      .select(
        `
        *,
        cases!inner (
          id,
          case_number,
          case_type,
          status,
          groom_first_name,
          bride_first_name,
          bride_last_name,
          wedding_date_gregorian,
          family_name,
          child_name,
          city,
          bank_details (
            id,
            bank_number,
            branch,
            account_number,
            account_holder_name
          )
        )
      `
      )
      .eq('payment_type', paymentType)
      .eq('status', PaymentStatus.APPROVED)
      .is('transferred_at', null);

    // Apply filters
    if (filters) {
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.amount_min !== undefined) {
        query = query.gte('amount_ils', filters.amount_min);
      }
      if (filters.amount_max !== undefined) {
        query = query.lte('amount_ils', filters.amount_max);
      }
      if (filters.city && paymentType === PaymentType.WEDDING_TRANSFER) {
        query = query.eq('cases.city', filters.city);
      }
      if (filters.payment_month && paymentType === PaymentType.MONTHLY_CLEANING) {
        query = query.eq('payment_month', filters.payment_month);
      }
      if (filters.search) {
        // Free text search in case number or names
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `cases.case_number.ilike.${searchTerm},` +
            `cases.groom_first_name.ilike.${searchTerm},` +
            `cases.bride_first_name.ilike.${searchTerm},` +
            `cases.family_name.ilike.${searchTerm},` +
            `cases.child_name.ilike.${searchTerm},` +
            `bank_details.account_holder_name.ilike.${searchTerm}`
        );
      }
    }

    // Default sorting
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new TransferError(
        'Failed to fetch pending transfers',
        'FETCH_ERROR',
        error
      );
    }

    // Map the data to rename 'cases' to 'case' and extract bank_details
    return (data || []).map((item: {
      cases?: {
        bank_details?: unknown;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    }) => {
      const bankDetails = item.cases?.bank_details;
      const normalizedBankDetails = Array.isArray(bankDetails)
        ? bankDetails[0]
        : bankDetails;

      return {
        ...item,
        case: item.cases,
        bank_details: normalizedBankDetails,
      };
    }) as TransferWithDetails[];
  } catch (error) {
    if (error instanceof TransferError) throw error;
    throw new TransferError(
      'Unexpected error fetching transfers',
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Fetch wedding transfers specifically
 */
export async function fetchWeddingTransfers(filters?: TransferFilters) {
  return fetchPendingTransfers(PaymentType.WEDDING_TRANSFER, filters) as Promise<
    WeddingTransfer[]
  >;
}

/**
 * Fetch cleaning transfers specifically
 */
export async function fetchCleaningTransfers(filters?: TransferFilters) {
  return fetchPendingTransfers(PaymentType.MONTHLY_CLEANING, filters) as Promise<
    CleaningTransfer[]
  >;
}

// ========================================
// Fetch Single Transfer
// ========================================

/**
 * Fetch single transfer by payment ID
 */
export async function fetchTransferById(paymentId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        cases!inner (
          *,
          bank_details (*)
        )
      `
      )
      .eq('id', paymentId)
      .single();

    if (error) {
      throw new TransferError('Failed to fetch transfer', 'FETCH_ERROR', error);
    }

    // Map the data and extract bank_details
    const bankDetails = data.cases?.bank_details;
    const normalizedBankDetails = Array.isArray(bankDetails)
      ? bankDetails[0]
      : bankDetails;

    return {
      ...data,
      case: data.cases,
      bank_details: normalizedBankDetails,
    } as unknown as TransferWithDetails;
  } catch (error) {
    if (error instanceof TransferError) throw error;
    throw new TransferError(
      'Unexpected error fetching transfer',
      'UNKNOWN_ERROR',
      error
    );
  }
}

// ========================================
// Update Transfer Status
// ========================================

/**
 * Update single transfer status
 */
export async function updateTransferStatus(
  paymentId: string,
  updateData: BulkUpdateData
) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      throw new TransferError(
        'Failed to update transfer status',
        'UPDATE_ERROR',
        error
      );
    }

    return data as Transfer;
  } catch (error) {
    if (error instanceof TransferError) throw error;
    throw new TransferError(
      'Unexpected error updating transfer',
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Bulk update transfer statuses
 */
export async function bulkUpdateTransfers(
  paymentIds: string[],
  updateData: BulkUpdateData,
  supabase?: SupabaseClient<Database>
) {
  const client = supabase || createClient();

  try {
    const { data, error } = await client
      .from('payments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .in('id', paymentIds)
      .select();

    if (error) {
      throw new TransferError(
        'Failed to bulk update transfers',
        'BULK_UPDATE_ERROR',
        error
      );
    }

    return data as Transfer[];
  } catch (error) {
    if (error instanceof TransferError) throw error;
    throw new TransferError(
      'Unexpected error in bulk update',
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Mark transfers as transferred (after export)
 */
export async function markTransfersAsTransferred(
  paymentIds: string[],
  receiptReference?: string
) {
  const supabase = createClient();

  try {
    // Update payment statuses
    const updatedPayments = await bulkUpdateTransfers(paymentIds, {
      status: PaymentStatus.TRANSFERRED,
      transferred_at: new Date().toISOString(),
      receipt_reference: receiptReference,
    });

    // Get unique case IDs from the updated payments
    const caseIds = [...new Set(updatedPayments.map((p) => p.case_id))];

    // Update case statuses to TRANSFERRED (for wedding cases)
    if (caseIds.length > 0) {
      const { error: caseUpdateError } = await supabase
        .from('cases')
        .update({
          status: 'transferred',
          updated_at: new Date().toISOString(),
        })
        .in('id', caseIds)
        .eq('case_type', 'wedding'); // Only update wedding cases

      if (caseUpdateError) {
        console.error('Failed to update case statuses:', caseUpdateError);
        // Don't throw - payment update was successful
      }
    }

    return updatedPayments;
  } catch (error) {
    if (error instanceof TransferError) throw error;
    throw new TransferError(
      'Unexpected error marking transfers',
      'UNKNOWN_ERROR',
      error
    );
  }
}

// ========================================
// Summary & Statistics
// ========================================

/**
 * Calculate transfer summary statistics
 */
export function calculateTransferSummary(
  transfers: TransferWithDetails[]
): TransferSummary {
  const summary: TransferSummary = {
    total_count: transfers.length,
    total_amount_ils: 0,
    total_amount_usd: 0,
    by_status: {
      [PaymentStatus.PENDING]: { count: 0, amount_ils: 0, amount_usd: 0 },
      [PaymentStatus.APPROVED]: { count: 0, amount_ils: 0, amount_usd: 0 },
      [PaymentStatus.TRANSFERRED]: { count: 0, amount_ils: 0, amount_usd: 0 },
      [PaymentStatus.REJECTED]: { count: 0, amount_ils: 0, amount_usd: 0 },
    },
  };

  transfers.forEach((transfer) => {
    // Total amounts
    summary.total_amount_ils += transfer.amount_ils;
    summary.total_amount_usd += transfer.amount_usd || 0;

    // By status
    const status = transfer.status as PaymentStatus;
    if (summary.by_status[status]) {
      summary.by_status[status].count++;
      summary.by_status[status].amount_ils += transfer.amount_ils;
      summary.by_status[status].amount_usd += transfer.amount_usd || 0;
    }
  });

  return summary;
}

// ========================================
// Export History
// ========================================

/**
 * Case info for export record
 */
export interface CaseExportInfo {
  case_id: string;
  case_number: number;
  amount: number;
}

/**
 * Record export in transfers_export table
 */
export async function recordExport(
  exportData: {
    export_type: string;
    exported_by: string;
    filename: string;
    file_url?: string;
    cases_included: CaseExportInfo[];
    total_amount: number;
    total_count: number;
  },
  supabase?: SupabaseClient<Database>
) {
  const client = supabase || createClient();

  try {
    // Log the data being inserted for debugging
    console.log('Recording export with data:', {
      export_type: exportData.export_type,
      exported_by: exportData.exported_by,
      filename: exportData.filename,
      cases_count: exportData.cases_included.length,
      total_amount: exportData.total_amount,
      total_count: exportData.total_count,
    });

    const insertData = {
      export_type: exportData.export_type,
      exported_by: exportData.exported_by,
      filename: exportData.filename,
      file_url: exportData.file_url,
      cases_included: JSON.parse(JSON.stringify(exportData.cases_included)),
      total_amount: exportData.total_amount,
      total_count: exportData.total_count,
      exported_at: new Date().toISOString(),
    };

    console.log('Insert data:', JSON.stringify(insertData, null, 2));

    const { data, error } = await client
      .from('transfers_export')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Database error details:', error);
      throw new TransferError('Failed to record export', 'RECORD_ERROR', error);
    }

    return data;
  } catch (error) {
    if (error instanceof TransferError) throw error;
    throw new TransferError(
      'Unexpected error recording export',
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Fetch export history
 */
export async function fetchExportHistory(filters?: {
  export_type?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}) {
  const supabase = createClient();

  try {
    let query = supabase
      .from('transfers_export')
      .select('*')
      .order('exported_at', { ascending: false });

    if (filters) {
      if (filters.export_type) {
        query = query.eq('export_type', filters.export_type);
      }
      if (filters.date_from) {
        query = query.gte('exported_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('exported_at', filters.date_to);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new TransferError(
        'Failed to fetch export history',
        'FETCH_ERROR',
        error
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TransferError) throw error;
    throw new TransferError(
      'Unexpected error fetching history',
      'UNKNOWN_ERROR',
      error
    );
  }
}

// ========================================
// Validation
// ========================================

/**
 * Validate transfer data before export
 */
export function validateTransferForExport(transfer: TransferWithDetails): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check bank details
  if (!transfer.bank_details) {
    errors.push('Missing bank details');
  } else {
    if (!transfer.bank_details.bank_number) {
      errors.push('Missing bank number');
    }
    if (!transfer.bank_details.branch) {
      errors.push('Missing branch code');
    }
    if (!transfer.bank_details.account_number) {
      errors.push('Missing account number');
    }
    if (!transfer.bank_details.account_holder_name) {
      errors.push('Missing account holder name');
    }
  }

  // Check amount
  if (!transfer.amount_ils || transfer.amount_ils <= 0) {
    errors.push('Invalid amount');
  }

  // Check status
  if (transfer.status !== PaymentStatus.APPROVED) {
    errors.push('Transfer must be approved');
  }

  // Check if already transferred
  if (transfer.transferred_at) {
    errors.push('Transfer already processed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate batch of transfers
 */
export function validateTransfersForExport(transfers: TransferWithDetails[]): {
  valid: boolean;
  errors: Record<string, string[]>;
  validCount: number;
  invalidCount: number;
} {
  const errors: Record<string, string[]> = {};
  let validCount = 0;
  let invalidCount = 0;

  transfers.forEach((transfer) => {
    const validation = validateTransferForExport(transfer);
    if (validation.valid) {
      validCount++;
    } else {
      invalidCount++;
      errors[transfer.id] = validation.errors;
    }
  });

  return {
    valid: invalidCount === 0,
    errors,
    validCount,
    invalidCount,
  };
}
