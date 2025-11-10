/**
 * MASAV Server Service
 *
 * Server-side MASAV export using our custom file generator.
 * This file can only be imported in server-side code (API routes).
 *
 * IMPORTANT: Do NOT import this in client-side code!
 */

import { TransferWithDetails } from '@/types/transfers.types';
import { PaymentType } from '@/types/case.types';
import {
  MasavExportOptions,
  MasavUrgency,
  ExportResult,
} from '@/types/export.types';
import {
  validateBankDetails,
  validateTransfersForMasav,
} from '@/lib/services/masav.service';
import { getMasavOrganizationSettings } from '@/lib/services/settings.service';
import {
  generateMasavFile,
  MasavFileOptions,
} from '@/lib/services/masav-file-generator.service';

// ========================================
// Error Types
// ========================================

export class MasavServerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MasavServerError';
  }
}

// ========================================
// Main Export Function
// ========================================

/**
 * Export transfers to MASAV format (server-side only)
 */
export async function exportToMasavServer(
  transfers: TransferWithDetails[],
  paymentType: PaymentType,
  options: MasavExportOptions = {}
): Promise<ExportResult> {
  try {
    // Validate inputs
    if (!transfers || transfers.length === 0) {
      throw new MasavServerError('No transfers to export', 'NO_DATA');
    }

    // Validate before export if requested
    if (options.validate_before_export !== false) {
      const validation = validateTransfersForMasav(transfers);
      if (!validation.valid) {
        throw new MasavServerError(
          'Validation failed',
          'VALIDATION_ERROR',
          validation.errors
        );
      }
    }

    // Get organization settings
    const orgSettings = await getMasavOrganizationSettings();

    // Prepare file generation options
    const today = new Date();
    const paymentDate = options.execution_date
      ? parseExecutionDate(options.execution_date)
      : today;

    const fileOptions: MasavFileOptions = {
      paymentDate,
      creationDate: today,
      fileExtension: options.file_extension || 'txt', // Support txt, dat, msv
    };

    // Generate MASAV file using our custom generator
    const result = await generateMasavFile(orgSettings, transfers, fileOptions);

    // Generate filename (allow custom filename)
    const typeLabel =
      paymentType === PaymentType.WEDDING_TRANSFER ? 'wedding' : 'cleaning';
    const urgencyLabel = options.urgency === MasavUrgency.URGENT ? '_urgent' : '';
    const filename =
      options.filename ||
      `masav_${typeLabel}${urgencyLabel}_${formatDateForFilename(today)}.${fileOptions.fileExtension}`;

    // Create blob from file content
    const fileBlob = new Blob([result.fileContent], {
      type: 'text/plain;charset=ascii', // MASAV uses ASCII
    });

    // Return result
    return {
      success: true,
      filename,
      file_blob: fileBlob,
      total_count: result.recordCount,
      total_amount: result.totalAmount,
    };
  } catch (error) {
    if (error instanceof MasavServerError) throw error;
    throw new MasavServerError(
      'Failed to generate MASAV file',
      'EXPORT_ERROR',
      error
    );
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Format date for filename (YYYYMMDD)
 */
function formatDateForFilename(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Parse execution date string to Date object
 */
function parseExecutionDate(dateStr: string): Date {
  // Expect YYYY-MM-DD format
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new MasavServerError('Invalid execution date format', 'INVALID_DATE');
  }
  return date;
}
