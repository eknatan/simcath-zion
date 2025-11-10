/**
 * Export Service
 *
 * Handles Excel export for bank transfers.
 * Features:
 * - Generate Excel files with ExcelJS
 * - Support for both wedding and cleaning transfers
 * - RTL support for Hebrew content
 * - Formatted columns with currency and dates
 * - Summary row with totals
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  TransferWithDetails,
  WeddingTransfer,
  CleaningTransfer,
} from '@/types/transfers.types';
import {
  ExcelExportOptions,
  ExportResult,
  ExportError as ExportErrorType,
  ExcelColumn,
  EXCEL_CONSTANTS,
} from '@/types/export.types';
import { PaymentType } from '@/types/case.types';

// ========================================
// Error Types
// ========================================

export class ExcelExportError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ExcelExportError';
  }
}

// ========================================
// Column Definitions
// ========================================

/**
 * Wedding transfers column definitions
 */
const WEDDING_COLUMNS_HE: ExcelColumn[] = [
  { key: 'created_at', header: 'תאריך יצירה', width: 12, format: 'date' },
  { key: 'case_number', header: 'מס\' תיק', width: 10, format: 'number' },
  { key: 'names', header: 'חתן וכלה', width: 30, format: 'text' },
  { key: 'wedding_date', header: 'תאריך חתונה', width: 12, format: 'date' },
  { key: 'amount_usd', header: 'סכום $', width: 12, format: 'currency' },
  { key: 'amount_ils', header: 'סכום ₪', width: 12, format: 'currency' },
  { key: 'account_holder', header: 'בעל חשבון', width: 25, format: 'text' },
  { key: 'bank_number', header: 'בנק', width: 8, format: 'text' },
  { key: 'branch', header: 'סניף', width: 8, format: 'text' },
  { key: 'account_number', header: 'חשבון', width: 15, format: 'text' },
  { key: 'city', header: 'עיר', width: 15, format: 'text' },
];

const WEDDING_COLUMNS_EN: ExcelColumn[] = [
  { key: 'created_at', header: 'Created Date', width: 12, format: 'date' },
  { key: 'case_number', header: 'Case #', width: 10, format: 'number' },
  { key: 'names', header: 'Groom & Bride', width: 30, format: 'text' },
  { key: 'wedding_date', header: 'Wedding Date', width: 12, format: 'date' },
  { key: 'amount_usd', header: 'Amount $', width: 12, format: 'currency' },
  { key: 'amount_ils', header: 'Amount ₪', width: 12, format: 'currency' },
  { key: 'account_holder', header: 'Account Holder', width: 25, format: 'text' },
  { key: 'bank_number', header: 'Bank', width: 8, format: 'text' },
  { key: 'branch', header: 'Branch', width: 8, format: 'text' },
  { key: 'account_number', header: 'Account', width: 15, format: 'text' },
  { key: 'city', header: 'City', width: 15, format: 'text' },
];

/**
 * Cleaning transfers column definitions
 */
const CLEANING_COLUMNS_HE: ExcelColumn[] = [
  { key: 'created_at', header: 'תאריך יצירה', width: 12, format: 'date' },
  { key: 'case_number', header: 'מס\' תיק', width: 10, format: 'number' },
  { key: 'family_name', header: 'שם משפחה', width: 20, format: 'text' },
  { key: 'child_name', header: 'שם הילד', width: 20, format: 'text' },
  { key: 'payment_month', header: 'חודש תשלום', width: 12, format: 'text' },
  { key: 'amount_ils', header: 'סכום ₪', width: 12, format: 'currency' },
  { key: 'account_holder', header: 'בעל חשבון', width: 25, format: 'text' },
  { key: 'bank_number', header: 'בנק', width: 8, format: 'text' },
  { key: 'branch', header: 'סניף', width: 8, format: 'text' },
  { key: 'account_number', header: 'חשבון', width: 15, format: 'text' },
];

const CLEANING_COLUMNS_EN: ExcelColumn[] = [
  { key: 'created_at', header: 'Created Date', width: 12, format: 'date' },
  { key: 'case_number', header: 'Case #', width: 10, format: 'number' },
  { key: 'family_name', header: 'Family Name', width: 20, format: 'text' },
  { key: 'child_name', header: 'Child Name', width: 20, format: 'text' },
  { key: 'payment_month', header: 'Payment Month', width: 12, format: 'text' },
  { key: 'amount_ils', header: 'Amount ₪', width: 12, format: 'currency' },
  { key: 'account_holder', header: 'Account Holder', width: 25, format: 'text' },
  { key: 'bank_number', header: 'Bank', width: 8, format: 'text' },
  { key: 'branch', header: 'Branch', width: 8, format: 'text' },
  { key: 'account_number', header: 'Account', width: 15, format: 'text' },
];

// ========================================
// Main Export Function
// ========================================

/**
 * Export transfers to Excel
 */
export async function exportToExcel(
  transfers: TransferWithDetails[],
  paymentType: PaymentType,
  options: ExcelExportOptions = {}
): Promise<ExportResult> {
  try {
    // Validate inputs
    if (!transfers || transfers.length === 0) {
      throw new ExcelExportError('No transfers to export', 'NO_DATA');
    }

    // Default options
    const locale = options.locale || 'he';
    const includeHeaders = options.include_headers !== false;
    const includeSummary = options.include_summary !== false;
    const sheetName =
      options.sheet_name ||
      (locale === 'he' ? 'העברות בנקאיות' : 'Bank Transfers');

    // Select columns based on type and locale
    const columns = getColumns(paymentType, locale);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Shimchat Zion System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName, {
      properties: { defaultRowHeight: 20 },
      views: [{ rightToLeft: locale === 'he' }],
    });

    // Set columns
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || EXCEL_CONSTANTS.DEFAULT_COLUMN_WIDTH,
    }));

    // Style header row
    if (includeHeaders) {
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;
    }

    // Add data rows
    const errors: ExportErrorType[] = [];
    let totalAmountILS = 0;
    let totalAmountUSD = 0;

    transfers.forEach((transfer) => {
      try {
        const rowData = extractRowData(transfer, paymentType);
        const row = worksheet.addRow(rowData);

        // Format cells
        formatRow(row, columns, locale);

        // Accumulate totals
        totalAmountILS += transfer.amount_ils;
        totalAmountUSD += transfer.amount_usd || 0;
      } catch (error) {
        errors.push({
          transfer_id: transfer.id,
          case_number: transfer.case.case_number,
          error_code: 'ROW_ERROR',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Add summary row
    if (includeSummary) {
      addSummaryRow(
        worksheet,
        columns,
        transfers.length,
        totalAmountILS,
        totalAmountUSD,
        locale
      );
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const typeLabel = paymentType === PaymentType.WEDDING_TRANSFER ? 'wedding' : 'cleaning';
    const filename = options.filename || `transfers_${typeLabel}_${timestamp}.xlsx`;

    // Generate file blob
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Return result
    return {
      success: errors.length === 0,
      filename,
      file_blob: blob,
      total_count: transfers.length,
      total_amount: totalAmountILS,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    if (error instanceof ExcelExportError) throw error;
    throw new ExcelExportError(
      'Failed to generate Excel file',
      'EXPORT_ERROR',
      error
    );
  }
}

/**
 * Export and download Excel file
 */
export async function exportAndDownload(
  transfers: TransferWithDetails[],
  paymentType: PaymentType,
  options: ExcelExportOptions = {}
): Promise<ExportResult> {
  const result = await exportToExcel(transfers, paymentType, options);

  if (result.file_blob) {
    saveAs(result.file_blob, result.filename);
  }

  return result;
}

// ========================================
// Helper Functions
// ========================================

/**
 * Get column definitions based on payment type and locale
 */
function getColumns(paymentType: PaymentType, locale: 'he' | 'en'): ExcelColumn[] {
  if (paymentType === PaymentType.WEDDING_TRANSFER) {
    return locale === 'he' ? WEDDING_COLUMNS_HE : WEDDING_COLUMNS_EN;
  } else {
    return locale === 'he' ? CLEANING_COLUMNS_HE : CLEANING_COLUMNS_EN;
  }
}

/**
 * Extract row data from transfer object
 */
function extractRowData(
  transfer: TransferWithDetails,
  paymentType: PaymentType
): Record<string, any> {
  const baseData = {
    created_at: transfer.created_at ? new Date(transfer.created_at) : '',
    case_number: transfer.case.case_number,
    amount_ils: transfer.amount_ils,
    amount_usd: transfer.amount_usd || 0,
    account_holder: transfer.bank_details.account_holder_name,
    bank_number: transfer.bank_details.bank_number,
    branch: transfer.bank_details.branch,
    account_number: transfer.bank_details.account_number,
  };

  if (paymentType === PaymentType.WEDDING_TRANSFER) {
    const weddingTransfer = transfer as WeddingTransfer;
    return {
      ...baseData,
      names: `${weddingTransfer.case.groom_first_name || ''} & ${
        weddingTransfer.case.bride_first_name || ''
      } ${weddingTransfer.case.bride_last_name || ''}`.trim(),
      wedding_date: weddingTransfer.case.wedding_date_gregorian
        ? new Date(weddingTransfer.case.wedding_date_gregorian)
        : '',
      city: weddingTransfer.case.city || '',
    };
  } else {
    const cleaningTransfer = transfer as CleaningTransfer;
    return {
      ...baseData,
      family_name: cleaningTransfer.case.family_name || '',
      child_name: cleaningTransfer.case.child_name || '',
      payment_month: cleaningTransfer.payment_month || '',
    };
  }
}

/**
 * Format row cells based on column definitions
 */
function formatRow(row: ExcelJS.Row, columns: ExcelColumn[], locale: 'he' | 'en') {
  columns.forEach((col, index) => {
    const cell = row.getCell(index + 1);

    // Apply format based on column type
    switch (col.format) {
      case 'currency':
        cell.numFmt = locale === 'he' ? '#,##0.00 ₪' : '$#,##0.00';
        cell.alignment = { horizontal: 'right' };
        break;
      case 'number':
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
        break;
      case 'date':
        cell.numFmt = 'dd/mm/yyyy';
        cell.alignment = { horizontal: 'center' };
        break;
      case 'text':
      default:
        cell.alignment = {
          horizontal: locale === 'he' ? 'right' : 'left',
          wrapText: false,
        };
        break;
    }
  });
}

/**
 * Add summary row with totals
 */
function addSummaryRow(
  worksheet: ExcelJS.Worksheet,
  columns: ExcelColumn[],
  totalCount: number,
  totalAmountILS: number,
  totalAmountUSD: number,
  locale: 'he' | 'en'
) {
  // Add empty row
  worksheet.addRow({});

  // Find column indices
  const amountILSIndex = columns.findIndex((col) => col.key === 'amount_ils') + 1;
  const amountUSDIndex = columns.findIndex((col) => col.key === 'amount_usd') + 1;

  // Create summary row
  const summaryRow = worksheet.addRow({});
  summaryRow.getCell(1).value = locale === 'he' ? 'סה"כ:' : 'Total:';
  summaryRow.getCell(1).font = { bold: true, size: 12 };

  if (amountILSIndex > 0) {
    summaryRow.getCell(amountILSIndex).value = totalAmountILS;
    summaryRow.getCell(amountILSIndex).numFmt = locale === 'he' ? '#,##0.00 ₪' : '₪#,##0.00';
    summaryRow.getCell(amountILSIndex).font = { bold: true };
  }

  if (amountUSDIndex > 0) {
    summaryRow.getCell(amountUSDIndex).value = totalAmountUSD;
    summaryRow.getCell(amountUSDIndex).numFmt = '$#,##0.00';
    summaryRow.getCell(amountUSDIndex).font = { bold: true };
  }

  // Style summary row
  summaryRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFCE4D6' },
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: 'ILS' | 'USD'): string {
  const locale = currency === 'ILS' ? 'he-IL' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, locale: 'he' | 'en' = 'he'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-US').format(
    dateObj
  );
}
