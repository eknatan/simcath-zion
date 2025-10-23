/**
 * User Validation Schemas
 *
 * עקרונות SOLID:
 * - Single Responsibility: כל schema מאמת מקרה שימוש אחד
 * - Open/Closed: ניתן להרחיב עם refinements נוספים
 */

import { z } from 'zod';

/**
 * User Role Schema
 */
export const userRoleSchema = z.enum(['secretary', 'manager'], {
  message: 'validation.invalidRole',
});

/**
 * User Status Schema
 */
export const userStatusSchema = z.enum(['active', 'suspended'], {
  message: 'validation.invalidStatus',
});

/**
 * Email Schema - ולידציה מחמירה לאימייל
 */
export const emailSchema = z
  .string({ message: 'validation.required' })
  .min(1, { message: 'validation.required' })
  .email({ message: 'validation.invalidEmail' })
  .max(255, { message: 'validation.emailTooLong' })
  .toLowerCase()
  .trim();

/**
 * Name Schema - שם משתמש
 */
export const nameSchema = z
  .string({ message: 'validation.required' })
  .min(2, { message: 'validation.nameTooShort' })
  .max(100, { message: 'validation.nameTooLong' })
  .trim();

/**
 * Phone Schema - טלפון אופציונלי
 */
export const phoneSchema = z
  .string()
  .regex(/^[0-9\-+() ]+$/, { message: 'validation.invalidPhone' })
  .min(9, { message: 'validation.phoneTooShort' })
  .max(20, { message: 'validation.phoneTooLong' })
  .trim()
  .optional()
  .nullable();

/**
 * Notes Schema - הערות אופציונליות
 */
export const notesSchema = z
  .string()
  .max(1000, { message: 'validation.notesTooLong' })
  .trim()
  .optional()
  .nullable();

/**
 * Create User Schema - ולידציה ליצירת משתמש חדש
 */
export const createUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  role: userRoleSchema,
  phone: phoneSchema,
  notes: notesSchema,
});

/**
 * Update User Schema - ולידציה לעדכון משתמש
 * כל השדות אופציונליים
 */
export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  phone: phoneSchema,
  notes: notesSchema,
});

/**
 * User Filters Schema - ולידציה לפילטרים
 */
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Types - ייצוא types מה-schemas
 */
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type UserFiltersSchema = z.infer<typeof userFiltersSchema>;
