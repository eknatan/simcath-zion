// ========================================
// Manual Transfers Types
// ========================================

/**
 * Manual transfer status
 */
export enum ManualTransferStatus {
  PENDING = 'pending',
  SELECTED = 'selected',
  EXPORTED = 'exported',
}

/**
 * Manual transfer record from database
 */
export interface ManualTransfer {
  id: string;
  recipient_name: string;
  id_number?: string | null;
  bank_code: string;
  branch_code: string;
  account_number: string;
  amount: number;
  status: ManualTransferStatus;
  imported_from_file?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Manual transfer with creator info
 */
export interface ManualTransferWithCreator extends ManualTransfer {
  creator?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

// ========================================
// Excel Import Types
// ========================================

/**
 * Expected Excel column names (Hebrew & English)
 */
export const EXCEL_COLUMN_NAMES = {
  RECIPIENT_NAME: ['שם', 'name', 'recipient', 'שם מקבל'],
  ID_NUMBER: ['זהות', 'id', 'id_number', 'ת.ז', 'תעודת זהות'],
  AMOUNT: ['סכום', 'amount', 'sum'],
  BANK_CODE: ['בנק', 'bank', 'bank_code', 'מספר בנק'],
  BRANCH_CODE: ['סניף', 'branch', 'branch_code', 'מספר סניף'],
  ACCOUNT_NUMBER: ['חשבון', 'account', 'account_number', 'מספר חשבון'],
} as const;

/**
 * Column mapping type
 */
export type ExcelColumnKey = keyof typeof EXCEL_COLUMN_NAMES;

/**
 * Column mapping - maps Excel column index to our field
 */
export interface ExcelColumnMapping {
  recipient_name: number;
  id_number?: number;
  amount: number;
  bank_code: number;
  branch_code: number;
  account_number: number;
}

/**
 * Raw Excel row data (before validation)
 */
export interface ExcelRowData {
  [columnIndex: number]: string | number | null;
}

/**
 * Parsed Excel row
 */
export interface ParsedExcelRow {
  rowNumber: number;
  data: {
    recipient_name?: string;
    id_number?: string;
    amount?: number;
    bank_code?: string;
    branch_code?: string;
    account_number?: string;
  };
}

/**
 * Excel import result
 */
export interface ExcelImportResult {
  success: boolean;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  transfers: ManualTransfer[];
  errors: ExcelImportError[];
  warnings: string[];
  filename: string;
}

/**
 * Excel import error
 */
export interface ExcelImportError {
  rowNumber: number;
  field?: string;
  errorCode: string;
  errorMessage: string;
  rawData?: Record<string, unknown>;
}

// ========================================
// Validation Types
// ========================================

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  INVALID_BANK_CODE = 'invalid_bank_code',
  INVALID_BRANCH_CODE = 'invalid_branch_code',
  INVALID_ACCOUNT_NUMBER = 'invalid_account_number',
  INVALID_AMOUNT = 'invalid_amount',
  INVALID_ID_NUMBER = 'invalid_id_number',
  EMPTY_ROW = 'empty_row',
}

/**
 * Single field validation result
 */
export interface FieldValidationResult {
  valid: boolean;
  value?: string | number;
  normalized?: string | number; // Normalized/cleaned value
  error?: {
    code: ValidationErrorCode;
    message: string;
  };
}

/**
 * Full row validation result
 */
export interface RowValidationResult {
  valid: boolean;
  rowNumber: number;
  data?: {
    recipient_name: string;
    id_number?: string;
    amount: number;
    bank_code: string;
    branch_code: string;
    account_number: string;
  };
  errors: Array<{
    field: string;
    code: ValidationErrorCode;
    message: string;
  }>;
}

/**
 * Bank account validation constraints
 */
export const BANK_VALIDATION_RULES = {
  BANK_CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 3,
    PATTERN: /^[0-9]{1,3}$/,
  },
  BRANCH_CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 3,
    PATTERN: /^[0-9]{1,3}$/,
  },
  ACCOUNT_NUMBER: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
    PATTERN: /^[0-9]{2,20}$/,
  },
  AMOUNT: {
    MIN: 0.01,
    MAX: 999999.99,
  },
  ID_NUMBER: {
    LENGTH: 9,
    PATTERN: /^[0-9]{9}$/,
  },
} as const;

// ========================================
// Filter & Selection Types
// ========================================

/**
 * Filter options for manual transfers
 */
export interface ManualTransferFilters {
  status?: ManualTransferStatus;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string; // Free text search in recipient_name
  imported_from_file?: string;
}

/**
 * Sort options
 */
export interface ManualTransferSort {
  field: 'created_at' | 'amount' | 'recipient_name' | 'status';
  direction: 'asc' | 'desc';
}

/**
 * Selection state
 */
export interface ManualTransferSelection {
  selectedIds: string[];
  selectAll: boolean;
}

// ========================================
// Export Types
// ========================================

/**
 * Manual transfer export record
 */
export interface ManualTransferExport {
  id: string;
  exported_by?: string | null;
  exported_at: string;
  filename?: string | null;
  file_url?: string | null;
  transfers_included: string[]; // Array of transfer IDs
  total_amount: number;
  total_count: number;
}

/**
 * Export result
 */
export interface ManualTransferExportResult {
  success: boolean;
  filename: string;
  file_url?: string;
  file_blob?: Blob;
  total_count: number;
  total_amount: number;
  errors?: Array<{
    transfer_id: string;
    error_message: string;
  }>;
  export_record_id?: string;
}

// ========================================
// Summary & Statistics
// ========================================

/**
 * Manual transfers summary
 */
export interface ManualTransferSummary {
  total_count: number;
  total_amount: number;
  by_status: Record<ManualTransferStatus, {
    count: number;
    amount: number;
  }>;
  recent_imports: Array<{
    filename: string;
    count: number;
    date: string;
  }>;
}

// ========================================
// Form Types
// ========================================

/**
 * Manual transfer form data (for manual creation)
 */
export interface ManualTransferFormData {
  recipient_name: string;
  id_number?: string;
  bank_code: string;
  branch_code: string;
  account_number: string;
  amount: number;
}
