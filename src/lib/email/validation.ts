/**
 * Email Validation Schemas
 * סכמות ולידציה עם Zod לכל סוגי המיילים
 */

import { z } from 'zod';

// Base schemas
export const emailAddressSchema = z.union([
  z.string().email(),
  z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),
]);

export const emailAddressesSchema = z.union([
  emailAddressSchema,
  z.array(emailAddressSchema),
]);

export const attachmentSchema = z.object({
  filename: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)]).optional(),
  path: z.string().optional(),
  contentType: z.string().optional(),
});

// Welcome email data
export const welcomeEmailDataSchema = z.object({
  userName: z.string().min(1, 'שם משתמש חובה'),
  userEmail: z.string().email('כתובת מייל לא תקינה'),
  loginUrl: z.string().url().optional(),
  locale: z.enum(['he', 'en']).optional(),
});

// Case created email data
export const caseCreatedEmailDataSchema = z.object({
  caseNumber: z.union([
    z.number().int().positive('מספר תיק חייב להיות חיובי'),
    z.string().min(1, 'מספר תיק חובה')
  ]),
  caseType: z.enum(['wedding', 'cleaning'], {
    message: 'סוג תיק לא תקין',
  }),
  applicantName: z.string().min(1, 'שם מבקש חובה'),
  applicantEmail: z.union([
    z.string().email(),
    z.literal(''),
    z.undefined()
  ]).optional().transform(val => val === '' ? undefined : val),
  applicantPhone: z.string().optional(),
  caseUrl: z.string().url().optional(),
  additionalInfo: z.record(z.string(), z.any()).optional(),
  fullFormData: z.any().optional(), // Full form data for detailed email template
  locale: z.enum(['he', 'en']).optional(),
});

// Applicant notification email data
export const applicantNotificationEmailDataSchema = z.object({
  applicantName: z.string().min(1, 'שם מבקש חובה'),
  caseType: z.enum(['wedding', 'cleaning'], {
    message: 'סוג תיק לא תקין',
  }),
  referenceNumber: z.string().optional(),
  locale: z.enum(['he', 'en']).optional(),
});

// Custom email (no data validation, only structure)
export const customEmailDataSchema = z.object({
  subject: z.string().min(1, 'נושא המייל חובה'),
  html: z.string().min(1, 'תוכן HTML חובה'),
  text: z.string().optional(),
});

// Main API request schema
export const sendEmailRequestSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('welcome'),
      to: emailAddressesSchema,
      data: welcomeEmailDataSchema,
      cc: emailAddressesSchema.optional(),
      bcc: emailAddressesSchema.optional(),
      replyTo: emailAddressSchema.optional(),
      attachments: z.array(attachmentSchema).optional(),
      locale: z.enum(['he', 'en']).optional(),
    }),
    z.object({
      type: z.literal('case-created'),
      to: emailAddressesSchema.optional(), // אופציונלי - ברירת מחדל למזכירות
      data: caseCreatedEmailDataSchema,
      cc: emailAddressesSchema.optional(),
      bcc: emailAddressesSchema.optional(),
      replyTo: emailAddressSchema.optional(),
      attachments: z.array(attachmentSchema).optional(),
      locale: z.enum(['he', 'en']).optional(),
    }),
    z.object({
      type: z.literal('applicant-notification'),
      to: emailAddressesSchema,
      data: applicantNotificationEmailDataSchema,
      cc: emailAddressesSchema.optional(),
      bcc: emailAddressesSchema.optional(),
      replyTo: emailAddressSchema.optional(),
      attachments: z.array(attachmentSchema).optional(),
      locale: z.enum(['he', 'en']).optional(),
    }),
    z.object({
      type: z.literal('custom'),
      to: emailAddressesSchema,
      subject: z.string().min(1),
      html: z.string().min(1),
      text: z.string().optional(),
      cc: emailAddressesSchema.optional(),
      bcc: emailAddressesSchema.optional(),
      replyTo: emailAddressSchema.optional(),
      attachments: z.array(attachmentSchema).optional(),
      locale: z.enum(['he', 'en']).optional(),
    }),
  ])
  .refine(
    (data) => {
      // Ensure at least one recipient
      const to = Array.isArray(data.to) ? data.to : [data.to];
      return to.length > 0;
    },
    { message: 'לפחות נמען אחד נדרש' }
  );

// Type exports
export type SendEmailRequest = z.infer<typeof sendEmailRequestSchema>;
export type WelcomeEmailData = z.infer<typeof welcomeEmailDataSchema>;
export type CaseCreatedEmailData = z.infer<typeof caseCreatedEmailDataSchema>;
export type ApplicantNotificationEmailData = z.infer<
  typeof applicantNotificationEmailDataSchema
>;
