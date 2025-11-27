import * as ExcelJS from 'exceljs';
import {
  EXCEL_COLUMN_NAMES,
  ManualTransferStatus,
  type ExcelColumnMapping,
  type ParsedExcelRow,
  type ExcelImportError,
  type ExcelImportResult,
  type ManualTransfer,
  ValidationErrorCode,
  type RowValidationResult,
} from '@/types/manual-transfers.types';
import { excelRowSchema } from '@/lib/validation/manual-transfer.schema';

const FIELD_NAMES_HE: Record<string, string> = {
  recipient_name: 'שם מקבל',
  id_number: 'תעודת זהות',
  amount: 'סכום',
  bank_code: 'קוד בנק',
  branch_code: 'קוד סניף',
  account_number: 'מספר חשבון',
  all: 'כל השדות',
  unknown: 'לא ידוע',
};

/**
 * Parse Excel file and extract manual transfers data
 */
export class ExcelParser {
  /**
   * Read Excel file from File object
   */
  static async parseFile(file: File): Promise<{
    headers: string[];
    rows: unknown[][];
    error?: string;
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0]; // First sheet
      if (!worksheet) {
        return { headers: [], rows: [], error: 'הקובץ ריק או לא תקין' };
      }

      const headers: string[] = [];
      const rows: unknown[][] = [];

      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value || '').trim();
      });

      // Get data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData: unknown[] = [];
        row.eachCell((cell, colNumber) => {
          rowData[colNumber - 1] = cell.value;
        });

        // Skip empty rows
        if (rowData.some((val) => val !== null && val !== undefined && val !== '')) {
          rows.push(rowData);
        }
      });

      return { headers, rows };
    } catch (error) {
      return {
        headers: [],
        rows: [],
        error: error instanceof Error ? error.message : 'שגיאה בקריאת הקובץ',
      };
    }
  }

  /**
   * Auto-detect column mapping based on header names
   */
  static detectColumnMapping(headers: string[]): Partial<ExcelColumnMapping> {
    const mapping: Partial<ExcelColumnMapping> = {};

    headers.forEach((header, index) => {
      const normalized = header.toLowerCase().trim();

      // Check for recipient name
      if (EXCEL_COLUMN_NAMES.RECIPIENT_NAME.some((name) => normalized.includes(name.toLowerCase()))) {
        mapping.recipient_name = index;
      }

      // Check for ID number
      if (EXCEL_COLUMN_NAMES.ID_NUMBER.some((name) => normalized.includes(name.toLowerCase()))) {
        mapping.id_number = index;
      }

      // Check for amount
      if (EXCEL_COLUMN_NAMES.AMOUNT.some((name) => normalized.includes(name.toLowerCase()))) {
        mapping.amount = index;
      }

      // Check for bank code
      if (EXCEL_COLUMN_NAMES.BANK_CODE.some((name) => normalized.includes(name.toLowerCase()))) {
        mapping.bank_code = index;
      }

      // Check for branch code
      if (EXCEL_COLUMN_NAMES.BRANCH_CODE.some((name) => normalized.includes(name.toLowerCase()))) {
        mapping.branch_code = index;
      }

      // Check for account number
      if (EXCEL_COLUMN_NAMES.ACCOUNT_NUMBER.some((name) => normalized.includes(name.toLowerCase()))) {
        mapping.account_number = index;
      }
    });

    return mapping;
  }

  /**
   * Validate that all required columns are mapped
   */
  static validateMapping(mapping: Partial<ExcelColumnMapping>): {
    valid: boolean;
    missing: string[];
  } {
    const required: Array<keyof ExcelColumnMapping> = [
      'recipient_name',
      'amount',
      'bank_code',
      'branch_code',
      'account_number',
    ];

    const missing = required.filter((key) => mapping[key] === undefined);

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Parse rows using column mapping
   */
  static parseRows(rows: unknown[][], mapping: ExcelColumnMapping): ParsedExcelRow[] {
    return rows.map((row, index) => ({
      rowNumber: index + 2, // +2 because Excel is 1-indexed and we skip header
      data: {
        recipient_name: this.getCellValue(row, mapping.recipient_name),
        id_number: mapping.id_number !== undefined ? this.getCellValue(row, mapping.id_number) : undefined,
        amount: this.getNumericValue(row, mapping.amount),
        bank_code: this.getCellValue(row, mapping.bank_code),
        branch_code: this.getCellValue(row, mapping.branch_code),
        account_number: this.getCellValue(row, mapping.account_number),
      },
    }));
  }

  /**
   * Get cell value as string
   */
  private static getCellValue(row: unknown[], index: number): string | undefined {
    const value = row[index];
    if (value === null || value === undefined || value === '') return undefined;
    return String(value).trim();
  }

  /**
   * Get cell value as number
   */
  private static getNumericValue(row: unknown[], index: number): number | undefined {
    const value = row[index];
    if (value === null || value === undefined || value === '') return undefined;

    if (typeof value === 'number') return value;

    const str = String(value).trim();
    // Remove commas and other non-numeric characters except . and -
    const cleaned = str.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);

    return isNaN(num) ? undefined : num;
  }

  /**
   * Validate parsed row
   */
  static validateRow(row: ParsedExcelRow): RowValidationResult {
    const errors: Array<{
      field: string;
      code: ValidationErrorCode;
      message: string;
    }> = [];

    // Check if row is empty
    const hasData = Object.values(row.data).some((val) => val !== undefined);
    if (!hasData) {
      return {
        valid: false,
        rowNumber: row.rowNumber,
        errors: [
          {
            field: 'all',
            code: ValidationErrorCode.EMPTY_ROW,
            message: 'שורה ריקה',
          },
        ],
      };
    }

    // Validate using Zod schema
    try {
      const validated = excelRowSchema.parse(row.data);

      return {
        valid: true,
        rowNumber: row.rowNumber,
        data: {
          recipient_name: validated.recipient_name,
          id_number: validated.id_number,
          amount: validated.amount,
          bank_code: validated.bank_code,
          branch_code: validated.branch_code,
          account_number: validated.account_number,
        },
        errors: [],
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodErrors = error.errors as Array<{ path: string[]; message: string }>;
        zodErrors.forEach((err) => {
          errors.push({
            field: err.path[0] || 'unknown',
            code: ValidationErrorCode.MISSING_REQUIRED_FIELD,
            message: err.message,
          });
        });
      } else {
        errors.push({
          field: 'all',
          code: ValidationErrorCode.MISSING_REQUIRED_FIELD,
          message: 'שגיאת ווליד‎ציה',
        });
      }

      return {
        valid: false,
        rowNumber: row.rowNumber,
        errors,
      };
    }
  }

  /**
   * Process complete Excel import
   */
  static async processImport(
    file: File,
    mapping?: ExcelColumnMapping
  ): Promise<ExcelImportResult> {
    try {
      // Parse file
      const { headers, rows, error: parseError } = await this.parseFile(file);

      if (parseError) {
        return {
          success: false,
          total_rows: 0,
          valid_rows: 0,
          invalid_rows: 0,
          transfers: [],
          errors: [
            {
              rowNumber: 0,
              errorCode: 'PARSE_ERROR',
              errorMessage: parseError,
            },
          ],
          warnings: [],
          filename: file.name,
        };
      }

      // Auto-detect mapping if not provided
      let columnMapping = mapping;
      if (!columnMapping) {
        const detected = this.detectColumnMapping(headers);
        const validation = this.validateMapping(detected);

        if (!validation.valid) {
          return {
            success: false,
            total_rows: 0,
            valid_rows: 0,
            invalid_rows: 0,
            transfers: [],
            errors: [
              {
                rowNumber: 0,
                errorCode: 'MISSING_COLUMNS',
                errorMessage: `חסרות עמודות: ${validation.missing.join(', ')}`,
              },
            ],
            warnings: [],
            filename: file.name,
          };
        }

        columnMapping = detected as ExcelColumnMapping;
      }

      // Parse rows
      const parsedRows = this.parseRows(rows, columnMapping);

      // Validate rows
      const validationResults = parsedRows.map((row) => this.validateRow(row));

      const validRows = validationResults.filter((r) => r.valid);
      const invalidRows = validationResults.filter((r) => !r.valid);

      const errors: ExcelImportError[] = invalidRows.flatMap((result) =>
        result.errors.map((err) => ({
          rowNumber: result.rowNumber,
          field: err.field,
          errorCode: err.code,
          errorMessage: err.message,
        }))
      );

      const transfers: Partial<ManualTransfer>[] = validRows.map((result) => ({
        recipient_name: result.data!.recipient_name,
        id_number: result.data!.id_number,
        amount: result.data!.amount,
        bank_code: result.data!.bank_code,
        branch_code: result.data!.branch_code,
        account_number: result.data!.account_number,
        status: ManualTransferStatus.PENDING,
        imported_from_file: file.name,
      }));

      return {
        success: validRows.length > 0,
        total_rows: parsedRows.length,
        valid_rows: validRows.length,
        invalid_rows: invalidRows.length,
        transfers: transfers as ManualTransfer[],
        errors,
        warnings: invalidRows.length > 0 ? [`${invalidRows.length} שורות לא עברו את הווליד‎ציה`] : [],
        filename: file.name,
      };
    } catch (error) {
      return {
        success: false,
        total_rows: 0,
        valid_rows: 0,
        invalid_rows: 0,
        transfers: [],
        errors: [
          {
            rowNumber: 0,
            errorCode: 'UNKNOWN_ERROR',
            errorMessage: error instanceof Error ? error.message : 'שגיאה לא ידועה',
          },
        ],
        warnings: [],
        filename: file.name,
      };
    }
  }

  /**
   * Export validation errors to Excel file
   */
  static async exportErrorsToExcel(errors: ExcelImportError[]): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('שגיאות ייבוא');

    // Set RTL for Hebrew
    worksheet.views = [{ rightToLeft: true }];

    // Define columns
    worksheet.columns = [
      { header: 'מספר שורה', key: 'rowNumber', width: 12 },
      { header: 'שדה', key: 'field', width: 15 },
      { header: 'שגיאה', key: 'errorMessage', width: 40 },
      { header: 'קוד שגיאה', key: 'errorCode', width: 20 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    headerRow.alignment = { horizontal: 'right' };

    // Add data rows
    errors.forEach((error) => {
      worksheet.addRow({
        rowNumber: error.rowNumber,
        field: FIELD_NAMES_HE[error.field || 'unknown'] || error.field,
        errorMessage: error.errorMessage,
        errorCode: error.errorCode,
      });
    });

    // Style all data cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { horizontal: 'right' };
        // Highlight error message in red
        const errorCell = row.getCell('errorMessage');
        errorCell.font = { color: { argb: 'FFDC2626' } };
      }
    });

    // Generate buffer and return as Blob
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}
