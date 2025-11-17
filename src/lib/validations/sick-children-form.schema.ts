import { z } from 'zod';

/**
 * Zod Schema לטופס ילדים חולים
 * טופס חד-עמודי עם כל השדות הנדרשים
 * עוקב אחר עקרונות SOLID - Single Responsibility
 */

// === Helper Schemas ===

/**
 * וולידציה לתעודת זהות ישראלית
 */
const israeliIdSchema = z
  .string()
  .min(1, 'validation.required')
  .regex(/^\d{9}$/, 'validation.invalidId')
  .refine(
    (id) => {
      // אלגוריתם לוהן לבדיקת תקינות ת.ז.
      const digits = id.split('').map(Number);
      const sum = digits.reduce((acc, digit, index) => {
        const step = digit * ((index % 2) + 1);
        return acc + (step > 9 ? step - 9 : step);
      }, 0);
      return sum % 10 === 0;
    },
    { message: 'validation.invalidIdChecksum' }
  );

/**
 * וולידציה לטלפון ישראלי
 */
const israeliPhoneSchema = z
  .string()
  .min(1, 'validation.required')
  .regex(/^0\d{1,2}-?\d{7}$/, 'validation.invalidPhone');

/**
 * וולידציה לטלפון אופציונלי
 */
const optionalIsraeliPhoneSchema = z
  .string()
  .regex(/^0\d{1,2}-?\d{7}$/, 'validation.invalidPhone')
  .optional()
  .or(z.literal(''));

/**
 * Schema מלא לטופס ילדים חולים
 * כל השדות בדף אחד
 */
export const sickChildrenFormSchema = z.object({
  // פרטי הורים
  parent1_id: israeliIdSchema,
  parent2_id: israeliIdSchema.optional().or(z.literal('')),
  family_name: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength|min=2')
    .max(100, 'validation.maxLength|max=100'),
  parent1_name: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength|min=2')
    .max(100, 'validation.maxLength|max=100'),
  parent2_name: z
    .string()
    .min(2, 'validation.minLength|min=2')
    .max(100, 'validation.maxLength|max=100')
    .optional()
    .or(z.literal('')),

  // פרטי הילד החולה
  child_name: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength|min=2')
    .max(100, 'validation.maxLength|max=100'),

  // כתובת
  address: z
    .string()
    .min(1, 'validation.required')
    .min(5, 'validation.minLength|min=5')
    .max(200, 'validation.maxLength|max=200'),
  city: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength|min=2')
    .max(100, 'validation.maxLength|max=100'),

  // פרטי קשר
  phone1: israeliPhoneSchema,
  phone2: optionalIsraeliPhoneSchema,
  phone3: optionalIsraeliPhoneSchema,
  email: z.string().min(1, 'validation.required').email('validation.invalidEmail'),

  // פרטי בנק
  bank_number: z
    .string()
    .min(1, 'validation.required')
    .regex(/^\d{1,3}$/, 'validation.invalidBankCode'),
  branch: z
    .string()
    .min(1, 'validation.required')
    .regex(/^\d{1,3}$/, 'validation.invalidBranchCode'),
  account_number: z
    .string()
    .min(1, 'validation.required')
    .regex(/^\d+$/, 'validation.invalidAccountNumber')
    .max(20, 'validation.maxLength|max=20'),
  account_holder_name: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength|min=2')
    .max(100, 'validation.maxLength|max=100'),
});

// === Types ===

/**
 * Type inference מה-schema
 * מאפשר TypeScript typing מלא בכל המערכת
 */
export type SickChildrenFormData = z.infer<typeof sickChildrenFormSchema>;

/**
 * Type לשמירה ב-DB (applicants table)
 */
export type SickChildrenApplicantData = {
  case_type: 'cleaning';
  form_data: SickChildrenFormData;
  email_sent_to_secretary: boolean;
  created_at: string;
};
