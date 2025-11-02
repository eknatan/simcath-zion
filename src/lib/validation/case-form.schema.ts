import { z } from 'zod';

// ========================================
// Validation Helpers
// ========================================

/**
 * Israeli ID validation (9 digits)
 */
const israeliIdSchema = z
  .string()
  .regex(/^\d{9}$/, 'מספר תעודת זהות חייב להכיל 9 ספרות בדיוק')
  .optional()
  .or(z.literal(''));

/**
 * Israeli phone validation
 * Formats: 050-1234567, 0501234567, 972501234567
 */
const israeliPhoneSchema = z
  .string()
  .regex(
    /^(?:(?:\+?972|\(?0\)?)(?:\-)?)?(?:5[0-9]|[2-4]|[8-9]|7[0-9])\-?\d{7}$/,
    'מספר טלפון לא תקין. דוגמה: 050-1234567'
  )
  .optional()
  .or(z.literal(''));

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email('כתובת מייל לא תקינה')
  .optional()
  .or(z.literal(''));

/**
 * Name validation (2-50 characters)
 */
const nameSchema = z
  .string()
  .min(2, 'שם חייב להכיל לפחות 2 תווים')
  .max(50, 'שם חייב להכיל עד 50 תווים')
  .optional()
  .or(z.literal(''));

/**
 * Required name validation
 */
const requiredNameSchema = z
  .string()
  .min(2, 'שדה חובה - נדרש לפחות 2 תווים')
  .max(50, 'שם חייב להכיל עד 50 תווים');

/**
 * Date validation (for weddings) - allows any date including past dates
 */
const dateSchema = z
  .string()
  .optional()
  .or(z.literal(''));

/**
 * Hebrew date validation (basic - you might want to enhance this)
 */
const hebrewDateSchema = z
  .string()
  .min(1, 'נדרש תאריך עברי')
  .optional()
  .or(z.literal(''));

// ========================================
// Wedding Form Schema
// ========================================

/**
 * Schema for wedding information section
 */
export const weddingInfoSchema = z.object({
  wedding_date_hebrew: hebrewDateSchema,
  wedding_date_gregorian: dateSchema,
  city: nameSchema,
  venue: z.string().optional().or(z.literal('')),
  guests_count: z.coerce
    .number()
    .int('מספר המוזמנים חייב להיות מספר שלם')
    .min(1, 'מספר המוזמנים חייב להיות לפחות 1')
    .max(10000, 'מספר המוזמנים לא יכול לעלות על 10,000')
    .optional(),
  total_cost: z.coerce
    .number()
    .min(0, 'עלות לא יכולה להיות שלילית')
    .optional(),
});

/**
 * Schema for groom information section
 */
export const groomInfoSchema = z.object({
  groom_first_name: requiredNameSchema,
  groom_last_name: requiredNameSchema,
  groom_id: israeliIdSchema,
  groom_school: nameSchema,
  groom_father_name: nameSchema,
  groom_father_occupation: z.string().optional().or(z.literal('')),
  groom_mother_name: nameSchema,
  groom_mother_occupation: z.string().optional().or(z.literal('')),
  groom_memorial_day: hebrewDateSchema,
  groom_background: z.string().optional().or(z.literal('')),
});

/**
 * Schema for bride information section
 */
export const brideInfoSchema = z.object({
  bride_first_name: requiredNameSchema,
  bride_last_name: requiredNameSchema,
  bride_id: israeliIdSchema,
  bride_school: nameSchema,
  bride_father_name: nameSchema,
  bride_father_occupation: z.string().optional().or(z.literal('')),
  bride_mother_name: nameSchema,
  bride_mother_occupation: z.string().optional().or(z.literal('')),
  bride_memorial_day: hebrewDateSchema,
  bride_background: z.string().optional().or(z.literal('')),
});

/**
 * Schema for wedding contact information
 */
export const weddingContactSchema = z.object({
  address: z.string().optional().or(z.literal('')),
  contact_phone: israeliPhoneSchema,
  contact_email: emailSchema,
});

/**
 * Complete wedding form schema (all sections combined)
 */
export const weddingFormSchema = z
  .object({})
  .merge(weddingInfoSchema)
  .merge(groomInfoSchema)
  .merge(brideInfoSchema)
  .merge(weddingContactSchema);

// ========================================
// Cleaning (Sick Children) Form Schema
// ========================================

/**
 * Schema for cleaning/sick children case
 */
export const cleaningFormSchema = z.object({
  family_name: requiredNameSchema,
  child_name: requiredNameSchema,

  parent1_name: requiredNameSchema,
  parent1_id: israeliIdSchema,

  parent2_name: nameSchema,
  parent2_id: israeliIdSchema,

  address: z.string().min(5, 'כתובת חייבת להכיל לפחות 5 תווים').optional(),
  city: requiredNameSchema,

  contact_phone: israeliPhoneSchema,
  contact_phone2: israeliPhoneSchema,
  contact_phone3: israeliPhoneSchema,
  contact_email: emailSchema,

  start_date: z
    .string()
    .refine(
      (date) => {
        if (!date) return false;
        return new Date(date) <= new Date();
      },
      { message: 'תאריך התחלה לא יכול להיות בעתיד' }
    )
    .optional(),
});

// ========================================
// Bank Details Schema
// ========================================

/**
 * Schema for bank details
 */
export const bankDetailsSchema = z.object({
  bank_number: z
    .string()
    .regex(/^\d{2}$/, 'מספר בנק חייב להיות 2 ספרות')
    .min(1, 'נדרש מספר בנק'),
  branch: z
    .string()
    .regex(/^\d{3}$/, 'מספר סניף חייב להיות 3 ספרות')
    .min(1, 'נדרש מספר סניף'),
  account_number: z
    .string()
    .regex(/^\d{2,20}$/, 'מספר חשבון חייב להיות בין 2-20 ספרות')
    .min(1, 'נדרש מספר חשבון'),
  account_holder_name: requiredNameSchema,
});

// ========================================
// Payment Schemas
// ========================================

/**
 * Schema for payment approval (wedding)
 */
export const paymentApprovalSchema = z.object({
  amount_usd: z.coerce
    .number()
    .min(0, 'סכום לא יכול להיות שלילי')
    .optional(),
  amount_ils: z.coerce
    .number()
    .min(1, 'סכום חייב להיות לפחות 1 ₪')
    .max(1000000, 'סכום לא יכול לעלות על 1,000,000 ₪'),
  exchange_rate: z.coerce
    .number()
    .min(0.1, 'שער חליפין לא תקין')
    .optional(),
  notes: z.string().optional(),
});

/**
 * Schema for monthly payment (cleaning)
 */
export const monthlyPaymentSchema = z.object({
  payment_month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'פורמט חודש לא תקין (צריך להיות YYYY-MM)')
    .min(1, 'נדרש לבחור חודש'),
  amount_ils: z.coerce
    .number()
    .min(1, 'סכום חייב להיות לפחות 1 ₪')
    .max(720, 'סכום חודשי מקסימלי הוא 720 ₪'),
  notes: z.string().optional(),
});

// ========================================
// Translation Schema
// ========================================

/**
 * Schema for translation request
 */
export const translationRequestSchema = z.object({
  case_id: z.string().uuid('מזהה תיק לא תקין'),
  lang_from: z.string().min(2).max(5),
  lang_to: z.string().min(2).max(5),
});

// ========================================
// Case Closure Schema
// ========================================

/**
 * Schema for closing a cleaning case
 */
export const caseClosureSchema = z.object({
  end_reason: z.enum(['healed', 'deceased', 'support_ended'], {
    message: 'נדרש לבחור סיבת סגירה',
  }),
  end_date: z.string().min(1, 'נדרש תאריך סגירה'),
  notes: z.string().optional(),
});

// ========================================
// Type Exports
// ========================================

// Export inferred types from schemas
export type WeddingFormData = z.infer<typeof weddingFormSchema>;
export type CleaningFormData = z.infer<typeof cleaningFormSchema>;
export type BankDetailsData = z.infer<typeof bankDetailsSchema>;
export type PaymentApprovalData = z.infer<typeof paymentApprovalSchema>;
export type MonthlyPaymentData = z.infer<typeof monthlyPaymentSchema>;
export type TranslationRequestData = z.infer<typeof translationRequestSchema>;
export type CaseClosureData = z.infer<typeof caseClosureSchema>;

// Export partial types for updates
export type PartialWeddingFormData = Partial<WeddingFormData>;
export type PartialCleaningFormData = Partial<CleaningFormData>;
