/**
 * MASAV File Generator Service
 *
 * Generates MASAV payment files according to the official Israeli bank specification.
 * Based on the official spec: מפרט טכני לביצוע תשלומים באמצעות מס"ב
 *
 * File Format:
 * - Fixed-width ASCII text file
 * - Each record: 128 characters + CR+LF (130 total)
 * - Record types: K (Header), 1 (Detail), 5 (Trailer), 9 (EOF)
 *
 * IMPORTANT:
 * - This generates ASCII text files, NOT binary files
 * - Each field has a fixed position and length
 * - Numeric fields must be zero-padded
 * - Text fields must be space-padded (right-aligned for Hebrew)
 */

import { TransferWithDetails } from '@/types/transfers.types';
import { MasavOrganizationSettings, type HebrewEncodingType } from './settings.service';

// ========================================
// Constants (from official spec)
// ========================================

const RECORD_LENGTH = 128;
const LINE_ENDING = '\r\n'; // CR+LF
const CURRENCY_CODE = '00'; // Always 00 for ILS
const TRANSACTION_TYPE = '006'; // זיכוי רגיל (regular credit)

// ========================================
// Types
// ========================================

export interface MasavFileOptions {
  paymentDate: Date;
  creationDate?: Date;
  fileExtension?: 'txt' | 'dat' | 'msv'; // Support multiple extensions
}

export interface MasavFileResult {
  fileContent: string;
  fileName: string;
  recordCount: number;
  totalAmount: number;
}

// ========================================
// Error Types
// ========================================

export class MasavGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MasavGenerationError';
  }
}

// ========================================
// Main Generator Class
// ========================================

export class MasavFileGenerator {
  private settings: MasavOrganizationSettings;
  private options: MasavFileOptions;
  private hebrewEncoding: HebrewEncodingType;

  constructor(settings: MasavOrganizationSettings, options: MasavFileOptions) {
    this.settings = settings;
    this.options = {
      ...options,
      creationDate: options.creationDate || new Date(),
      fileExtension: options.fileExtension || 'txt',
    };
    // Use Hebrew Code A by default (most common)
    this.hebrewEncoding = settings.hebrew_encoding || 'code-a';

    this.validateSettings();
  }

  /**
   * Validate MASAV settings before generation
   */
  private validateSettings(): void {
    const { institution_id, bank_code, branch_code, account_number, sequence_number } =
      this.settings;

    if (!/^\d{8}$/.test(institution_id)) {
      throw new MasavGenerationError(
        'Institution ID must be 8 digits',
        'INVALID_INSTITUTION_ID'
      );
    }

    if (!/^\d{2}$/.test(bank_code)) {
      throw new MasavGenerationError('Bank code must be 2 digits', 'INVALID_BANK_CODE');
    }

    if (!/^\d{3}$/.test(branch_code)) {
      throw new MasavGenerationError('Branch code must be 3 digits', 'INVALID_BRANCH_CODE');
    }

    if (!/^\d{3}$/.test(sequence_number)) {
      throw new MasavGenerationError(
        'Sequence number must be 3 digits',
        'INVALID_SEQUENCE_NUMBER'
      );
    }

    if (!account_number || account_number.length === 0) {
      throw new MasavGenerationError('Account number is required', 'INVALID_ACCOUNT_NUMBER');
    }
  }

  /**
   * Generate complete MASAV file
   */
  public generate(transfers: TransferWithDetails[]): MasavFileResult {
    if (transfers.length === 0) {
      throw new MasavGenerationError('No transfers provided', 'NO_TRANSFERS');
    }

    // Validate all transfers first
    this.validateTransfers(transfers);

    const lines: string[] = [];

    // 1. Header Record (K)
    lines.push(this.generateHeaderRecord());

    // 2. Detail Records (1)
    transfers.forEach((transfer) => {
      lines.push(this.generateDetailRecord(transfer));
    });

    // 3. Trailer Record (5)
    const totalAmount = this.calculateTotalAmount(transfers);
    lines.push(this.generateTrailerRecord(transfers.length, totalAmount));

    // 4. End-of-file marker (128 nines)
    lines.push('9'.repeat(RECORD_LENGTH));

    // Join with CR+LF
    const fileContent = lines.join(LINE_ENDING) + LINE_ENDING;

    // Generate filename
    const fileName = this.generateFileName();

    return {
      fileContent,
      fileName,
      recordCount: transfers.length,
      totalAmount,
    };
  }

  /**
   * Validate all transfers before generation
   */
  private validateTransfers(transfers: TransferWithDetails[]): void {
    transfers.forEach((transfer, index) => {
      const errors: string[] = [];

      // Validate bank details
      if (!transfer.bank_details) {
        errors.push('Missing bank details');
      } else {
        if (!/^\d{2}$/.test(transfer.bank_details.bank_number)) {
          errors.push('Invalid bank code (must be 2 digits)');
        }
        if (!/^\d{3}$/.test(transfer.bank_details.branch)) {
          errors.push('Invalid branch code (must be 3 digits)');
        }
        if (!/^\d+$/.test(transfer.bank_details.account_number)) {
          errors.push('Invalid account number (must be digits only)');
        }
        if (!transfer.bank_details.account_holder_name) {
          errors.push('Missing account holder name');
        }
      }

      // Validate amount
      if (!transfer.amount_ils || transfer.amount_ils <= 0) {
        errors.push('Invalid amount (must be positive)');
      }
      if (transfer.amount_ils > 9999999999.99) {
        errors.push('Amount too large for MASAV format');
      }

      // Validate case number
      if (!transfer.case.case_number) {
        errors.push('Missing case number');
      }

      if (errors.length > 0) {
        throw new MasavGenerationError(
          `Transfer #${index + 1} validation failed: ${errors.join(', ')}`,
          'INVALID_TRANSFER',
          { transferId: transfer.id, errors }
        );
      }
    });
  }

  /**
   * Generate Header Record (Type K)
   * Position layout according to spec section 3.1
   */
  private generateHeaderRecord(): string {
    const parts: string[] = [];

    // 1. Record type (pos 1, length 1)
    parts.push('K');

    // 2. Institution/Subject code (pos 2-9, length 8)
    parts.push(this.padNumeric(this.settings.institution_id, 8));

    // 3. Currency (pos 10-11, length 2)
    parts.push(CURRENCY_CODE);

    // 4. Payment date (pos 12-17, length 6) YYMMDD
    parts.push(this.formatDate(this.options.paymentDate));

    // 5. Filler (pos 18, length 1)
    parts.push('0');

    // 6. Sequence number (pos 19-21, length 3)
    parts.push(this.padNumeric(this.settings.sequence_number, 3));

    // 7. Filler (pos 22, length 1)
    parts.push('0');

    // 8. Creation date (pos 23-28, length 6) YYMMDD
    parts.push(this.formatDate(this.options.creationDate!));

    // 9. Sending institution (pos 29-33, length 5)
    // Use first 5 digits of institution_id
    parts.push(this.settings.institution_id.substring(0, 5));

    // 10. Filler (pos 34-39, length 6)
    parts.push('0'.repeat(6));

    // 11. Institution name (pos 40-69, length 30)
    parts.push(this.padText(this.settings.institution_name, 30, 'right'));

    // 12. Filler (pos 70-125, length 56)
    parts.push(' '.repeat(56));

    // 13. Header identifier (pos 126-128, length 3)
    parts.push('KOT');

    const record = parts.join('');

    // Ensure exactly 128 characters
    if (record.length !== RECORD_LENGTH) {
      throw new MasavGenerationError(
        `Header record length is ${record.length}, expected ${RECORD_LENGTH}`,
        'INVALID_RECORD_LENGTH'
      );
    }

    return record;
  }

  /**
   * Generate Detail Record (Type 1)
   * Position layout according to spec section 3.2
   */
  private generateDetailRecord(transfer: TransferWithDetails): string {
    const parts: string[] = [];
    const { bank_details } = transfer;

    // 1. Record type (pos 1, length 1)
    parts.push('1');

    // 2. Institution/Subject code (pos 2-9, length 8)
    parts.push(this.padNumeric(this.settings.institution_id, 8));

    // 3. Currency (pos 10-11, length 2)
    parts.push(CURRENCY_CODE);

    // 4. Filler (pos 12-17, length 6)
    parts.push('0'.repeat(6));

    // 5. Bank code (pos 18-19, length 2)
    parts.push(this.padNumeric(bank_details.bank_number, 2));

    // 6. Branch code (pos 20-22, length 3)
    parts.push(this.padNumeric(bank_details.branch, 3));

    // 7. Account type (pos 23-26, length 4)
    parts.push('0000');

    // 8. Account number (pos 27-35, length 9)
    parts.push(this.padNumeric(bank_details.account_number, 9));

    // 9. Filler (pos 36, length 1)
    parts.push('0');

    // 10. Beneficiary ID (pos 37-45, length 9)
    // ID number - not available in our system, using zeros
    parts.push(this.padNumeric('000000000', 9));

    // 11. Beneficiary name (pos 46-61, length 16)
    parts.push(this.padText(bank_details.account_holder_name, 16, 'right'));

    // 12. Amount (pos 62-74, length 13)
    // 11 digits for shekels + 2 digits for agorot
    const amountInAgorot = Math.round(transfer.amount_ils * 100);
    parts.push(this.padNumeric(amountInAgorot.toString(), 13));

    // 13. Reference/Asmachta (pos 75-94, length 20)
    const reference = transfer.case.case_number.toString();
    parts.push(this.padNumeric(reference, 20));

    // 14. Payment period (pos 95-102, length 8)
    parts.push('0'.repeat(8));

    // 15. Text code (pos 103-105, length 3)
    // Use transaction type code here (006 for regular credit)
    parts.push(TRANSACTION_TYPE);

    // 16. Transaction type (pos 106-108, length 3)
    // This should also be the transaction type
    parts.push(TRANSACTION_TYPE);

    // 17. Filler (pos 109-126, length 18)
    parts.push('0'.repeat(18));

    // 18. Filler (pos 127-128, length 2)
    parts.push('  ');

    const record = parts.join('');

    // Ensure exactly 128 characters
    if (record.length !== RECORD_LENGTH) {
      throw new MasavGenerationError(
        `Detail record length is ${record.length}, expected ${RECORD_LENGTH}`,
        'INVALID_RECORD_LENGTH'
      );
    }

    return record;
  }

  /**
   * Generate Trailer Record (Type 5)
   * Position layout according to spec section 3.3
   */
  private generateTrailerRecord(recordCount: number, totalAmount: number): string {
    const parts: string[] = [];

    // 1. Record type (pos 1, length 1)
    parts.push('5');

    // 2. Institution/Subject code (pos 2-9, length 8)
    parts.push(this.padNumeric(this.settings.institution_id, 8));

    // 3. Currency (pos 10-11, length 2)
    parts.push(CURRENCY_CODE);

    // 4. Payment date (pos 12-17, length 6)
    parts.push(this.formatDate(this.options.paymentDate));

    // 5. Filler (pos 18, length 1)
    parts.push('0');

    // 6. Sequence number (pos 19-21, length 3)
    parts.push(this.padNumeric(this.settings.sequence_number, 3));

    // 7. Total amount (pos 22-36, length 15)
    // Sum of all transaction amounts in agorot
    const totalAmountInAgorot = Math.round(totalAmount * 100);
    parts.push(this.padNumeric(totalAmountInAgorot.toString(), 15));

    // 8. Filler (pos 37-51, length 15)
    parts.push('0'.repeat(15));

    // 9. Number of records (pos 52-58, length 7)
    parts.push(this.padNumeric(recordCount.toString(), 7));

    // 10. Filler (pos 59-65, length 7)
    parts.push('0'.repeat(7));

    // 11. Filler (pos 66-128, length 63)
    parts.push(' '.repeat(63));

    const record = parts.join('');

    // Ensure exactly 128 characters
    if (record.length !== RECORD_LENGTH) {
      throw new MasavGenerationError(
        `Trailer record length is ${record.length}, expected ${RECORD_LENGTH}`,
        'INVALID_RECORD_LENGTH'
      );
    }

    return record;
  }

  /**
   * Calculate total amount of all transfers
   */
  private calculateTotalAmount(transfers: TransferWithDetails[]): number {
    return transfers.reduce((sum, transfer) => sum + transfer.amount_ils, 0);
  }

  /**
   * Generate filename for MASAV file
   * Format: MASAV_YYMMDD_SSS.ext
   */
  private generateFileName(): string {
    const dateStr = this.formatDate(this.options.paymentDate);
    const seqNum = this.settings.sequence_number;
    const ext = this.options.fileExtension;
    return `MASAV_${dateStr}_${seqNum}.${ext}`;
  }

  // ========================================
  // Helper Functions
  // ========================================

  /**
   * Format date as YYMMDD
   */
  private formatDate(date: Date): string {
    const yy = date.getFullYear().toString().substring(2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }

  /**
   * Pad numeric field with leading zeros
   */
  private padNumeric(value: string, length: number): string {
    const cleaned = value.replace(/\D/g, ''); // Remove non-digits
    return cleaned.padStart(length, '0').substring(0, length);
  }

  /**
   * Pad text field with spaces
   * @param align - 'left' or 'right' (Hebrew text is right-aligned)
   */
  private padText(value: string, length: number, align: 'left' | 'right' = 'left'): string {
    // Convert Hebrew characters to MASAV encoding before padding
    const converted = this.convertHebrewToMasav(value);
    const truncated = converted.substring(0, length);
    if (align === 'right') {
      return truncated.padStart(length, ' ');
    }
    return truncated.padEnd(length, ' ');
  }

  /**
   * Convert Hebrew characters to MASAV Hebrew encoding
   * According to the official MASAV Hebrew encoding table
   *
   * Supports two encoding types:
   * - Code A: Hebrew letters mapped to ASCII A-Z (0x41-0x5A)
   * - Code B: Hebrew letters mapped to bytes 128-154 (0x80-0x9A)
   */
  private convertHebrewToMasav(text: string): string {
    // Hebrew character mapping based on "טבלאות לעברית עבור מסב"

    if (this.hebrewEncoding === 'code-a') {
      // קוד עברי א - Hebrew Code A (ASCII mapping)
      const hebrewMapA: Record<string, string> = {
        א: '&', // 0x26
        ב: 'A', // 0x41
        ג: 'B', // 0x42
        ד: 'C', // 0x43
        ה: 'D', // 0x44
        ו: 'E', // 0x45
        ז: 'F', // 0x46
        ח: 'G', // 0x47
        ט: 'H', // 0x48
        י: 'I', // 0x49
        ך: 'J', // 0x4A (final kaf)
        כ: 'K', // 0x4B
        ל: 'L', // 0x4C
        ם: 'M', // 0x4D (final mem)
        מ: 'N', // 0x4E
        ן: 'O', // 0x4F (final nun)
        נ: 'P', // 0x50
        ס: 'Q', // 0x51
        ע: 'R', // 0x52
        ף: 'S', // 0x53 (final pe)
        פ: 'T', // 0x54
        ץ: 'U', // 0x55 (final tsadi)
        צ: 'V', // 0x56
        ק: 'W', // 0x57
        ר: 'X', // 0x58
        ש: 'Y', // 0x59
        ת: 'Z', // 0x5A
      };

      let result = '';
      for (const char of text) {
        if (hebrewMapA[char] !== undefined) {
          result += hebrewMapA[char];
        } else {
          // Keep as-is (numbers, spaces, punctuation)
          result += char;
        }
      }
      return result;
    } else {
      // קוד עברי ב - Hebrew Code B (128-154 mapping)
      const hebrewMapB: Record<string, number> = {
        א: 128, // 0x80
        ב: 129, // 0x81
        ג: 130, // 0x82
        ד: 131, // 0x83
        ה: 132, // 0x84
        ו: 133, // 0x85
        ז: 134, // 0x86
        ח: 135, // 0x87
        ט: 136, // 0x88
        י: 137, // 0x89
        ך: 138, // 0x8A (final kaf)
        כ: 139, // 0x8B
        ל: 140, // 0x8C
        ם: 141, // 0x8D (final mem)
        מ: 142, // 0x8E
        ן: 143, // 0x8F (final nun)
        נ: 144, // 0x90
        ס: 145, // 0x91
        ע: 146, // 0x92
        ף: 147, // 0x93 (final pe)
        פ: 148, // 0x94
        ץ: 149, // 0x95 (final tsadi)
        צ: 150, // 0x96
        ק: 151, // 0x97
        ר: 152, // 0x98
        ש: 153, // 0x99
        ת: 154, // 0x9A
      };

      let result = '';
      for (const char of text) {
        if (hebrewMapB[char] !== undefined) {
          result += String.fromCharCode(hebrewMapB[char]);
        } else {
          // Keep as-is (numbers, spaces, punctuation)
          result += char;
        }
      }
      return result;
    }
  }
}

// ========================================
// Convenience Functions
// ========================================

/**
 * Generate MASAV file from transfers
 */
export async function generateMasavFile(
  settings: MasavOrganizationSettings,
  transfers: TransferWithDetails[],
  options: MasavFileOptions
): Promise<MasavFileResult> {
  const generator = new MasavFileGenerator(settings, options);
  return generator.generate(transfers);
}
