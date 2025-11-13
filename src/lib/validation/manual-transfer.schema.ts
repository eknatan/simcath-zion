import { z } from 'zod';
import { BANK_VALIDATION_RULES } from '@/types/manual-transfers.types';

// ========================================
// Validation Helpers
// ========================================

/**
 * Israeli ID validation (auto-pads to 9 digits) - optional for manual transfers
 */
const israeliIdSchema = z
  .union([z.string(), z.undefined(), z.null()])
  .optional()
  .transform((val) => {
    if (!val || val === '') return undefined;
    const cleaned = String(val).replace(/\D/g, ''); // Remove non-digits
    if (cleaned.length === 0) return undefined;
    // Pad with zeros to make it 9 digits
    return cleaned.padStart(9, '0');
  })
  .pipe(
    z
      .string()
      .regex(/^\d{9}$/, 'מספר תעודת זהות חייב להכיל עד 9 ספרות')
      .optional()
      .or(z.undefined())
  );

/**
 * Bank code validation (2-3 digits)
 */
const bankCodeSchema = z
  .string()
  .min(
    BANK_VALIDATION_RULES.BANK_CODE.MIN_LENGTH,
    `קוד בנק חייב להכיל לפחות ${BANK_VALIDATION_RULES.BANK_CODE.MIN_LENGTH} ספרות`
  )
  .max(
    BANK_VALIDATION_RULES.BANK_CODE.MAX_LENGTH,
    `קוד בנק חייב להכיל עד ${BANK_VALIDATION_RULES.BANK_CODE.MAX_LENGTH} ספרות`
  )
  .regex(BANK_VALIDATION_RULES.BANK_CODE.PATTERN, 'קוד בנק חייב להכיל רק ספרות');

/**
 * Branch code validation (1-3 digits)
 */
const branchCodeSchema = z
  .string()
  .min(
    BANK_VALIDATION_RULES.BRANCH_CODE.MIN_LENGTH,
    `קוד סניף חייב להכיל לפחות ${BANK_VALIDATION_RULES.BRANCH_CODE.MIN_LENGTH} ספרה`
  )
  .max(
    BANK_VALIDATION_RULES.BRANCH_CODE.MAX_LENGTH,
    `קוד סניף חייב להכיל עד ${BANK_VALIDATION_RULES.BRANCH_CODE.MAX_LENGTH} ספרות`
  )
  .regex(BANK_VALIDATION_RULES.BRANCH_CODE.PATTERN, 'קוד סניף חייב להכיל רק ספרות');

/**
 * Account number validation (2-20 digits)
 */
const accountNumberSchema = z
  .string()
  .min(
    BANK_VALIDATION_RULES.ACCOUNT_NUMBER.MIN_LENGTH,
    `מספר חשבון חייב להכיל לפחות ${BANK_VALIDATION_RULES.ACCOUNT_NUMBER.MIN_LENGTH} ספרות`
  )
  .max(
    BANK_VALIDATION_RULES.ACCOUNT_NUMBER.MAX_LENGTH,
    `מספר חשבון חייב להכיל עד ${BANK_VALIDATION_RULES.ACCOUNT_NUMBER.MAX_LENGTH} ספרות`
  )
  .regex(BANK_VALIDATION_RULES.ACCOUNT_NUMBER.PATTERN, 'מספר חשבון חייב להכיל רק ספרות');

/**
 * Amount validation (positive number with 2 decimals)
 */
const amountSchema = z
  .number()
  .positive('סכום חייב להיות חיובי')
  .min(BANK_VALIDATION_RULES.AMOUNT.MIN, `סכום מינימלי: ${BANK_VALIDATION_RULES.AMOUNT.MIN} ₪`)
  .max(BANK_VALIDATION_RULES.AMOUNT.MAX, `סכום מקסימלי: ${BANK_VALIDATION_RULES.AMOUNT.MAX} ₪`)
  .refine(
    (val) => {
      const decimal = val.toString().split('.')[1];
      return !decimal || decimal.length <= 2;
    },
    { message: 'סכום יכול להכיל עד 2 ספרות אחרי הנקודה' }
  );

/**
 * Recipient name validation (required, 2-255 characters)
 */
const recipientNameSchema = z
  .string()
  .min(2, 'שם מקבל חייב להכיל לפחות 2 תווים')
  .max(255, 'שם מקבל חייב להכיל עד 255 תווים')
  .trim();

// ========================================
// Main Schemas
// ========================================

/**
 * Manual transfer creation schema
 */
export const manualTransferCreateSchema = z.object({
  recipient_name: recipientNameSchema,
  id_number: israeliIdSchema,
  bank_code: bankCodeSchema,
  branch_code: branchCodeSchema,
  account_number: accountNumberSchema,
  amount: amountSchema,
});

/**
 * Manual transfer update schema (all fields optional)
 */
export const manualTransferUpdateSchema = z.object({
  recipient_name: recipientNameSchema.optional(),
  id_number: israeliIdSchema.optional(),
  bank_code: bankCodeSchema.optional(),
  branch_code: branchCodeSchema.optional(),
  account_number: accountNumberSchema.optional(),
  amount: amountSchema.optional(),
});

/**
 * Bulk import schema (array of transfers)
 */
export const manualTransferBulkImportSchema = z.array(manualTransferCreateSchema);

/**
 * Excel row validation schema (allows string/number inputs before normalization)
 * Then validates against the main schema requirements
 */
export const excelRowSchema = z
  .object({
    recipient_name: z.union([z.string(), z.number()]).transform((val) => String(val).trim()),
    id_number: z
      .union([z.string(), z.number(), z.null(), z.undefined()])
      .optional()
      .transform((val) => (val ? String(val).trim() : undefined)),
    bank_code: z.union([z.string(), z.number()]).transform((val) => String(val).trim()),
    branch_code: z.union([z.string(), z.number()]).transform((val) => String(val).trim()),
    account_number: z.union([z.string(), z.number()]).transform((val) => String(val).trim()),
    amount: z
      .union([z.string(), z.number()])
      .transform((val) => {
        const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
        return isNaN(num) ? 0 : num;
      })
      .pipe(z.number()),
  })
  .pipe(manualTransferCreateSchema);

/**
 * Filters schema
 */
export const manualTransferFiltersSchema = z.object({
  status: z.enum(['pending', 'selected', 'exported']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  amount_min: z.number().positive().optional(),
  amount_max: z.number().positive().optional(),
  search: z.string().optional(),
  imported_from_file: z.string().optional(),
});

/**
 * Export options schema
 */
export const manualTransferExportSchema = z.object({
  transfer_ids: z.array(z.string().uuid()).min(1, 'יש לבחור לפחות העברה אחת'),
  urgency: z.enum(['regular', 'urgent']).optional(),
  execution_date: z.string().optional(),
  mark_as_exported: z.boolean().default(true),
});

// ========================================
// TypeScript Types from Schemas
// ========================================

export type ManualTransferCreateInput = z.infer<typeof manualTransferCreateSchema>;
export type ManualTransferUpdateInput = z.infer<typeof manualTransferUpdateSchema>;
export type ManualTransferBulkImportInput = z.infer<typeof manualTransferBulkImportSchema>;
export type ExcelRowInput = z.infer<typeof excelRowSchema>;
export type ManualTransferFiltersInput = z.infer<typeof manualTransferFiltersSchema>;
export type ManualTransferExportInput = z.infer<typeof manualTransferExportSchema>;
