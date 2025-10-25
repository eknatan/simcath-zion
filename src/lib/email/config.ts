/**
 * Email Configuration
 * קובץ הגדרות למערכת האימייל
 */

import type { EmailConfig } from '@/types/email.types';
import { settingsService } from '@/lib/settings/settings-service';

export const emailConfig: EmailConfig = {
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '465', 10),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASSWORD || '',
  },
};

export const defaultFrom = {
  email: process.env.MAIL_USER || 'simcahtziondata@gmail.com',
  name: 'Simchat Zion | שמחת ציון',
};

/**
 * כתובות מייל למזכירות - ברירת מחדל מ-ENV
 * לשימוש סינכרוני בלבד (עדיף להשתמש ב-getSecretaryEmails)
 */
export const secretaryEmails = [
  process.env.SECRETARY_EMAIL_1 || 'secretary@example.com',
  process.env.SECRETARY_EMAIL_2,
].filter(Boolean) as string[];

/**
 * קבלת מיילי מזכירות מ-DB (אסינכרוני)
 * זו הדרך המועדפת!
 */
export async function getSecretaryEmails(): Promise<string[]> {
  try {
    const emails = await settingsService.getSecretaryEmails();
    return emails.length > 0 ? emails : secretaryEmails;
  } catch (error) {
    console.error('Failed to load secretary emails from DB, using fallback:', error);
    return secretaryEmails;
  }
}

// אימות הגדרות
export function validateEmailConfig(): boolean {
  const errors: string[] = [];

  if (!emailConfig.auth.user) {
    errors.push('MAIL_USER is not defined in environment variables');
  }

  if (!emailConfig.auth.pass) {
    errors.push('MAIL_PASSWORD is not defined in environment variables');
  }

  if (!emailConfig.host) {
    errors.push('MAIL_HOST is not defined in environment variables');
  }

  if (errors.length > 0) {
    console.error('Email configuration errors:', errors);
    return false;
  }

  return true;
}
