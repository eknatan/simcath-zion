/**
 * MASAV Service
 *
 * Handles MASAV (Israeli bank transfer format) file generation.
 * Uses the 'masav' npm package for proper formatting and validation.
 *
 * IMPORTANT: Do NOT implement MASAV logic manually!
 * The 'masav' package handles:
 * - Bank validation
 * - Standard format (Bank of Israel)
 * - Automatic checksums
 * - Proper encoding (windows-1255)
 *
 * Features:
 * - Generate MASAV files from transfers
 * - Validate bank details
 * - Support for regular and urgent transfers
 */

// Note: masav is imported dynamically to avoid bundling Node.js dependencies in client
import { saveAs } from 'file-saver';
import { TransferWithDetails } from '@/types/transfers.types';
import {
  ExportResult,
  MasavRecord,
  MasavValidationResult,
  MasavValidationError,
  MasavBankValidation,
  MASAV_CONSTANTS,
} from '@/types/export.types';
import { PaymentType } from '@/types/case.types';

// ========================================
// Error Types
// ========================================

export class MasavError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MasavError';
  }
}

// ========================================
// Main Export Function
// ========================================

/**
 * Export transfers to MASAV format
 */
export async function exportToMasav(
  _transfers: TransferWithDetails[],
  _paymentType: PaymentType
): Promise<ExportResult> {
  // Note: This function should be called from a server-side API route
  // because the masav package uses Node.js fs module
  throw new MasavError(
    'MASAV export must be done via API route',
    'NOT_IMPLEMENTED'
  );
}

/**
 * Export and download MASAV file
 */
export async function exportAndDownload(
  transfers: TransferWithDetails[],
  paymentType: PaymentType
): Promise<ExportResult> {
  const result = await exportToMasav(transfers, paymentType);

  if (result.file_blob) {
    saveAs(result.file_blob, result.filename);
  }

  return result;
}

// ========================================
// Conversion Functions
// ========================================

/**
 * Convert transfer to MASAV record format
 */
export function convertToMasavRecord(transfer: TransferWithDetails): MasavRecord {
  const bankDetails = transfer.bank_details;

  // Validate and normalize bank details
  const validation = validateBankDetails(
    bankDetails.bank_number,
    bankDetails.branch,
    bankDetails.account_number
  );

  if (!validation.bank_code.valid) {
    throw new MasavError(
      `Invalid bank code for case ${transfer.case.case_number}`,
      'INVALID_BANK_CODE'
    );
  }

  if (!validation.branch_code.valid) {
    throw new MasavError(
      `Invalid branch code for case ${transfer.case.case_number}`,
      'INVALID_BRANCH_CODE'
    );
  }

  if (!validation.account_number.valid) {
    throw new MasavError(
      `Invalid account number for case ${transfer.case.case_number}`,
      'INVALID_ACCOUNT_NUMBER'
    );
  }

  // Convert amount to agorot (cents)
  const amountInAgorot = Math.round(transfer.amount_ils * 100);

  // Truncate beneficiary name to max length
  const beneficiaryName = truncateString(
    bankDetails.account_holder_name,
    MASAV_CONSTANTS.BENEFICIARY_NAME_MAX_LENGTH
  );

  // Format reference (case number)
  const reference = String(transfer.case.case_number).padStart(
    MASAV_CONSTANTS.REFERENCE_MAX_LENGTH,
    '0'
  );

  return {
    beneficiary_name: beneficiaryName,
    bank_code: validation.bank_code.normalized,
    branch_code: validation.branch_code.normalized,
    account_number: validation.account_number.normalized,
    amount: amountInAgorot,
    reference,
  };
}

// ========================================
// Validation Functions
// ========================================

/**
 * Validate bank details for MASAV format
 */
export function validateBankDetails(
  bankCode: string,
  branchCode: string,
  accountNumber: string
): MasavBankValidation {
  // Validate bank code (1-3 digits)
  const bankValid = /^\d{1,3}$/.test(bankCode);
  const bankNormalized = bankCode.padStart(MASAV_CONSTANTS.BANK_CODE_LENGTH, '0');

  // Validate branch code (1-3 digits)
  const branchValid = /^\d{1,3}$/.test(branchCode);
  const branchNormalized = branchCode.padStart(MASAV_CONSTANTS.BRANCH_CODE_LENGTH, '0');

  // Validate account number (up to 20 chars, typically digits)
  const accountValid =
    /^\d+$/.test(accountNumber) &&
    accountNumber.length <= MASAV_CONSTANTS.ACCOUNT_NUMBER_MAX_LENGTH;
  const accountNormalized = accountNumber.padStart(
    Math.min(accountNumber.length, MASAV_CONSTANTS.ACCOUNT_NUMBER_MAX_LENGTH),
    '0'
  );

  return {
    bank_code: {
      valid: bankValid,
      normalized: bankNormalized,
    },
    branch_code: {
      valid: branchValid,
      normalized: branchNormalized,
    },
    account_number: {
      valid: accountValid,
      normalized: accountNormalized,
    },
  };
}

/**
 * Validate single transfer for MASAV export
 */
export function validateTransferForMasav(
  transfer: TransferWithDetails
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check bank details exist
  if (!transfer.bank_details) {
    errors.push('Missing bank details');
    return { valid: false, errors };
  }

  // Validate bank details format
  const validation = validateBankDetails(
    transfer.bank_details.bank_number,
    transfer.bank_details.branch,
    transfer.bank_details.account_number
  );

  if (!validation.bank_code.valid) {
    errors.push('Invalid bank code format (must be 1-3 digits)');
  }

  if (!validation.branch_code.valid) {
    errors.push('Invalid branch code format (must be 1-3 digits)');
  }

  if (!validation.account_number.valid) {
    errors.push('Invalid account number format');
  }

  // Validate beneficiary name
  if (!transfer.bank_details.account_holder_name) {
    errors.push('Missing account holder name');
  } else if (transfer.bank_details.account_holder_name.length > MASAV_CONSTANTS.BENEFICIARY_NAME_MAX_LENGTH) {
    // This is just a warning, we'll truncate
    // errors.push('Account holder name too long (will be truncated)');
  }

  // Validate amount
  if (!transfer.amount_ils || transfer.amount_ils <= 0) {
    errors.push('Invalid amount (must be positive)');
  }

  if (transfer.amount_ils > 999999999) {
    errors.push('Amount too large for MASAV format');
  }

  // Check case number exists
  if (!transfer.case.case_number) {
    errors.push('Missing case number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate batch of transfers for MASAV export
 */
export function validateTransfersForMasav(
  transfers: TransferWithDetails[]
): MasavValidationResult {
  const errors: MasavValidationError[] = [];
  const warnings: string[] = [];

  transfers.forEach((transfer) => {
    const validation = validateTransferForMasav(transfer);

    if (!validation.valid) {
      validation.errors.forEach((errorMsg) => {
        errors.push({
          transfer_id: transfer.id,
          case_number: transfer.case.case_number,
          field: 'bank_details',
          error_code: 'VALIDATION_ERROR',
          error_message: errorMsg,
        });
      });
    }

    // Add warning if name will be truncated
    if (
      transfer.bank_details.account_holder_name &&
      transfer.bank_details.account_holder_name.length > MASAV_CONSTANTS.BENEFICIARY_NAME_MAX_LENGTH
    ) {
      warnings.push(
        `Case ${transfer.case.case_number}: Account holder name will be truncated to ${MASAV_CONSTANTS.BENEFICIARY_NAME_MAX_LENGTH} characters`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ========================================
// Helper Functions
// ========================================

/**
 * Parse execution date string to Date object
 */
export function parseExecutionDate(dateStr: string): Date {
  // Expect YYYY-MM-DD format
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new MasavError('Invalid execution date format', 'INVALID_DATE');
  }
  return date;
}

/**
 * Truncate string to max length
 */
function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) : str;
}

/**
 * Format amount in agorot (for display/debugging)
 */
export function formatAmountInAgorot(amount: number): string {
  return `${amount} אגורות (${(amount / 100).toFixed(2)} ₪)`;
}

/**
 * Check if MASAV package is available
 */
export function isMasavAvailable(): boolean {
  // MASAV is only available server-side
  return false;
}
