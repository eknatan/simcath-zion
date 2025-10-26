/**
 * Password Validation Schema
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק validation של סיסמאות
 * - Open/Closed: ניתן להרחבה עם דרישות נוספות
 */

import { z } from 'zod';

/**
 * Password requirements:
 * - לפחות 8 תווים
 * - לפחות אות גדולה אחת
 * - לפחות אות קטנה אחת
 * - לפחות מספר אחד
 */
export const passwordSchema = (t: (key: string) => string) =>
  z
    .string()
    .min(8, t('validation.passwordMinLength'))
    .regex(/[A-Z]/, t('validation.passwordUppercase'))
    .regex(/[a-z]/, t('validation.passwordLowercase'))
    .regex(/[0-9]/, t('validation.passwordNumber'));

/**
 * Set Password Schema - להגדרת סיסמה ראשונית (invitation)
 */
export const setPasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      password: passwordSchema(t),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });

/**
 * Reset Password Schema - לאיפוס סיסמה
 */
export const resetPasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      password: passwordSchema(t),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });

/**
 * Type inference
 */
export type SetPasswordInput = z.infer<ReturnType<typeof setPasswordSchema>>;
export type ResetPasswordInput = z.infer<ReturnType<typeof resetPasswordSchema>>;
