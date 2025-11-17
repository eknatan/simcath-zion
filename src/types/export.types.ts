import { Tables } from './supabase';
import { TransferWithDetails } from './transfers.types';

// ========================================
// Base Types
// ========================================

export type TransferExport = Tables<'transfers_export'>;

// ========================================
// Export Types
// ========================================

/**
 * Export file types
 */
export enum ExportType {
  EXCEL = 'excel',
  MASAV = 'masav',
}

/**
 * MASAV export urgency level
 */
export enum MasavUrgency {
  REGULAR = 'regular',
  URGENT = 'urgent',
}

// ========================================
// Export Options
// ========================================

/**
 * Common export options
 */
export interface BaseExportOptions {
  filename?: string;
  include_headers?: boolean;
  include_summary?: boolean;
  mark_as_transferred?: boolean; // Whether to mark transfers as transferred after export
}

/**
 * Excel export options
 */
export interface ExcelExportOptions extends BaseExportOptions {
  columns?: ExcelColumn[];
  locale?: 'he' | 'en';
  sheet_name?: string;
}

/**
 * MASAV export options
 */
export interface MasavExportOptions extends BaseExportOptions {
  urgency?: MasavUrgency;
  execution_date?: string; // YYYY-MM-DD
  validate_before_export?: boolean;
  file_extension?: 'txt' | 'dat' | 'msv'; // File extension (default: txt)
}

/**
 * Excel column definition
 */
export interface ExcelColumn {
  key: string;
  header: string;
  width?: number;
  format?: 'text' | 'number' | 'currency' | 'date';
}

// ========================================
// Export Result
// ========================================

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  filename: string;
  file_url?: string;
  file_blob?: Blob;
  total_count: number;
  total_amount: number;
  errors?: ExportError[];
  warnings?: string[];
  export_record_id?: string; // ID in transfers_export table
}

/**
 * Export error
 */
export interface ExportError {
  transfer_id: string;
  case_number: number;
  error_code: string;
  error_message: string;
}

// ========================================
// MASAV Types
// ========================================

/**
 * MASAV record for bank transfer
 */
export interface MasavRecord {
  beneficiary_name: string; // שם המוטב
  bank_code: string; // קוד בנק (1-3 ספרות)
  branch_code: string; // קוד סניף (3 ספרות)
  account_number: string; // מספר חשבון
  amount: number; // סכום (אגורות)
  reference: string; // אסמכתא (מס' תיק)
  id_number?: string; // תעודת זהות (אופציונלי)
}

/**
 * MASAV file header
 */
export interface MasavHeader {
  record_type: string; // 'A'
  transmission_date: string; // DDMMYY
  sequence_number: number;
  bank_code: string; // בנק שולח
  branch_code: string; // סניף שולח
}

/**
 * MASAV file trailer
 */
export interface MasavTrailer {
  record_type: string; // 'C'
  total_records: number;
  total_amount: number;
  control_sum: number; // Checksum
}

/**
 * Complete MASAV file structure
 */
export interface MasavFile {
  header: MasavHeader;
  records: MasavRecord[];
  trailer: MasavTrailer;
}

// ========================================
// Email Types
// ========================================

/**
 * Email notification data after export
 */
export interface ExportEmailData {
  export_type: ExportType;
  filename: string;
  total_count: number;
  total_amount_ils: number;
  total_amount_usd: number;
  exported_by: string;
  exported_at: string;
  attachment_url?: string;
  attachment_blob?: Blob;
}

/**
 * Email recipients
 */
export interface ExportEmailRecipients {
  to: string[];
  cc?: string[];
  bcc?: string[];
}

// ========================================
// Export History
// ========================================

/**
 * Export history record with full details
 */
export interface ExportHistoryRecord extends TransferExport {
  exported_by_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
  transfers?: TransferWithDetails[];
}

/**
 * Export history filters
 */
export interface ExportHistoryFilters {
  export_type?: ExportType;
  date_from?: string;
  date_to?: string;
  exported_by?: string;
}

// ========================================
// Validation
// ========================================

/**
 * MASAV validation result
 */
export interface MasavValidationResult {
  valid: boolean;
  errors: MasavValidationError[];
  warnings?: string[];
}

/**
 * MASAV validation error
 */
export interface MasavValidationError {
  transfer_id: string;
  case_number: number;
  field: string;
  error_code: string;
  error_message: string;
}

/**
 * Bank account validation for MASAV
 */
export interface MasavBankValidation {
  bank_code: {
    valid: boolean;
    normalized: string; // Padded to required length
  };
  branch_code: {
    valid: boolean;
    normalized: string;
  };
  account_number: {
    valid: boolean;
    normalized: string;
  };
}

// ========================================
// Constants
// ========================================

/**
 * MASAV format constants
 */
export const MASAV_CONSTANTS = {
  RECORD_LENGTH: 128, // Fixed record length
  BANK_CODE_LENGTH: 3,
  BRANCH_CODE_LENGTH: 3,
  ACCOUNT_NUMBER_MAX_LENGTH: 20,
  BENEFICIARY_NAME_MAX_LENGTH: 30,
  REFERENCE_MAX_LENGTH: 12,
  ENCODING: 'windows-1255', // Hebrew encoding
} as const;

/**
 * Excel format constants
 */
export const EXCEL_CONSTANTS = {
  MAX_ROWS: 1048576,
  MAX_COLUMNS: 16384,
  DEFAULT_COLUMN_WIDTH: 15,
  CURRENCY_FORMAT: '#,##0.00 ₪',
  DATE_FORMAT: 'DD/MM/YYYY',
} as const;

/**
 * Export file naming patterns
 */
export const EXPORT_FILENAME_PATTERNS = {
  EXCEL: 'transfers_export_{type}_{date}.xlsx',
  MASAV: 'masav_{type}_{date}.txt',
} as const;
