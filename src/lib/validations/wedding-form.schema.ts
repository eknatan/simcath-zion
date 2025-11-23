import { z } from 'zod';

/**
 * Zod Schema לטופס חתונה
 * עוקב אחר עקרונות SOLID - Single Responsibility
 * כל schema מטפל בחלק ספציפי של הטופס
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
 * וולידציה לתאריך עברי מובנה
 */
const hebrewDateStructuredSchema = z.object({
  day: z.number().min(1).max(30).nullable(),
  month: z.number().min(1).max(13).nullable(),
  year: z.number().min(5700).max(6000).nullable(),
  gregorianDate: z.string().nullable(),
}).refine(
  (data) => {
    // Either all fields are set or all are null
    const hasDay = data.day !== null;
    const hasMonth = data.month !== null;
    const hasYear = data.year !== null;
    return (hasDay && hasMonth && hasYear) || (!hasDay && !hasMonth && !hasYear);
  },
  { message: 'validation.invalidHebrewDate' }
);

// === Section Schemas ===

/**
 * סקשן א': מידע החתונה
 * Single Responsibility - אחראי רק על נתוני החתונה הבסיסיים
 */
export const weddingInfoSchema = z.object({
  hebrew_date: hebrewDateStructuredSchema,
  date_gregorian: z
    .string()
    .min(1, 'validation.required')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'validation.pastDate'),
  city: z
    .string()
    .min(2, 'validation.minLength|min=2')
    .max(100, 'validation.maxLength|max=100'),
  venue: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength|min=2')
    .max(100, 'validation.maxLength|max=100'),
  guests_count: z
    .number({
      message: 'validation.invalidNumber',
    })
    .refine((v) => typeof v === 'number' && !Number.isNaN(v), 'validation.invalidNumber')
    .int('validation.mustBeInteger')
    .min(1, 'validation.minGuests')
    .max(5000, 'validation.maxGuests'),
  total_cost: z
    .number({
      message: 'validation.invalidNumber',
    })
    .refine((v) => typeof v === 'number' && !Number.isNaN(v), 'validation.invalidNumber')
    .min(0, 'validation.minCost')
    .max(10000000, 'validation.maxCost'),
  request_background: z.string().max(2000, 'validation.maxBackgroundLength').optional(),
});

/**
 * סקשן ב' וג': פרטי אדם (חתן/כלה)
 * Single Responsibility - אחראי על נתוני אדם בודד
 * Open/Closed - ניתן להרחבה ללא שינוי (למשל: להוסיף שדות נוספים)
 */
export const personInfoSchema = z.object({
  first_name: z
    .string()
    .min(2, 'validation.minLength|min=2')
    .max(50, 'validation.maxLength|max=50'),
  last_name: z
    .string()
    .min(2, 'validation.minLength|min=2')
    .max(50, 'validation.maxLength|max=50'),
  id: israeliIdSchema,
  school: z.string().max(100, 'validation.maxLength|max=100').optional(),
  father_name: z.string().max(100, 'validation.maxLength|max=100').optional(),
  father_occupation: z
    .string()
    .max(100, 'validation.maxLength|max=100')
    .optional(),
  mother_name: z.string().max(100, 'validation.maxLength|max=100').optional(),
  mother_occupation: z
    .string()
    .max(100, 'validation.maxLength|max=100')
    .optional(),
  address: z
    .string()
    .min(5, 'validation.minLength|min=5')
    .max(200, 'validation.maxLength|max=200'),
  city: z
    .string()
    .min(2, 'validation.minLength|min=2')
    .max(100, 'validation.maxLength|max=100'),
  phone: israeliPhoneSchema,
  email: z.string().email('validation.invalidEmail').optional(),
  memorial_day: z.string().max(100, 'validation.maxLength|max=100').optional(),
  background: z.string().max(2000, 'validation.maxBackgroundLength').optional(),
});

/**
 * Schema מלא לטופס חתונה
 * Interface Segregation - מורכב משלושה schemas ממוקדים
 */
export const weddingFormSchema = z.object({
  wedding_info: weddingInfoSchema,
  groom_info: personInfoSchema,
  bride_info: personInfoSchema,
});

// === Types ===

/**
 * Type inference מה-schema
 * מאפשר TypeScript typing מלא בכל המערכת
 */
export type WeddingFormData = z.infer<typeof weddingFormSchema>;
export type WeddingInfo = z.infer<typeof weddingInfoSchema>;
export type PersonInfo = z.infer<typeof personInfoSchema>;

/**
 * Type לשמירה ב-DB (applicants table)
 */
export type WeddingApplicantData = {
  case_type: 'wedding';
  form_data: WeddingFormData;
  email_sent_to_secretary: boolean;
  created_at: string;
};
