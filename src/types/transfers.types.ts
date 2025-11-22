import { Case, BankDetails, PaymentType, PaymentStatus } from './case.types';

// ========================================
// Base Types from Database
// ========================================

/**
 * Transfer record - extends Payment with related data
 */
export interface Transfer {
  id: string;
  case_id: string;
  payment_type: PaymentType;
  payment_month?: string | null;
  amount_ils: number;
  amount_usd?: number | null;
  exchange_rate?: number | null;
  status: PaymentStatus;
  approved_amount?: number | null;
  approved_by?: string | null;
  transferred_at?: string | null;
  receipt_reference?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Transfer with full case and bank details
 */
export interface TransferWithDetails extends Transfer {
  case: Case;
  bank_details: BankDetails;
}

/**
 * Wedding transfer - specific fields for wedding cases
 */
export interface WeddingTransfer extends TransferWithDetails {
  payment_type: PaymentType.WEDDING_TRANSFER;
  case: Case & {
    groom_first_name?: string | null;
    bride_first_name?: string | null;
    bride_last_name?: string | null;
    wedding_date_gregorian?: string | null;
    city?: string | null;
  };
}

/**
 * Monthly cleaning transfer - specific fields for sick children support
 */
export interface CleaningTransfer extends TransferWithDetails {
  payment_type: PaymentType.MONTHLY_CLEANING;
  payment_month: string; // Required for cleaning transfers
  case: Case & {
    family_name?: string | null;
    child_name?: string | null;
  };
}

// ========================================
// Filter Types
// ========================================

/**
 * Filter options for transfers list
 */
export interface TransferFilters {
  payment_type?: PaymentType;
  status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string; // Free text search
  city?: string; // For wedding transfers
  payment_month?: string; // For cleaning transfers (YYYY-MM)
}

/**
 * Sort options for transfers table
 */
export interface TransferSort {
  field: 'created_at' | 'amount_ils' | 'wedding_date_gregorian' | 'payment_month';
  direction: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface TransferPagination {
  page: number;
  pageSize: number;
  total?: number;
}

// ========================================
// Selection & Bulk Actions
// ========================================

/**
 * Selection state for transfers table
 */
export interface TransferSelection {
  selectedIds: string[];
  selectAll: boolean;
}

/**
 * Bulk update data
 */
export interface BulkUpdateData {
  status?: PaymentStatus;
  transferred_at?: string;
  receipt_reference?: string;
  notes?: string;
}

// ========================================
// Summary & Statistics
// ========================================

/**
 * Transfer summary statistics
 */
export interface TransferSummary {
  total_count: number;
  total_amount_ils: number;
  total_amount_usd: number;
  by_status: Record<PaymentStatus, {
    count: number;
    amount_ils: number;
    amount_usd: number;
  }>;
}

// ========================================
// Validation Types
// ========================================

/**
 * Bank account validation result
 */
export interface BankValidationResult {
  valid: boolean;
  errors: {
    bank_number?: string;
    branch?: string;
    account_number?: string;
    account_holder_name?: string;
  };
}

/**
 * Transfer validation result
 */
export interface TransferValidationResult {
  valid: boolean;
  errors: {
    amount?: string;
    bank_details?: string;
    status?: string;
    payment_month?: string;
  };
  warnings?: string[];
}

// ========================================
// Constants
// ========================================

/**
 * Amount limits for transfers
 */
/**
 * Transfer amount limits
 * Note: CLEANING.MAX is a default fallback. The actual cap is in system_settings.
 */
export const TRANSFER_LIMITS = {
  WEDDING: {
    MIN: 1000,
    MAX: 50000,
  },
  CLEANING: {
    MIN: 100,
    MAX: 720, // Default fallback - actual value from system_settings
  },
} as const;

/**
 * Transfer tab types
 */
export enum TransferTab {
  PENDING = 'pending',
  TRANSFERRED = 'transferred',
}

/**
 * Transfer type filter
 */
export enum TransferTypeFilter {
  ALL = 'all',
  WEDDING = 'wedding',
  CLEANING = 'cleaning',
}
