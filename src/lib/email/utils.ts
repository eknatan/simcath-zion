/**
 * Email Utility Functions
 * פונקציות עזר לעבודה עם מיילים
 */

import type { EmailAddress } from '@/types/email.types';

/**
 * המרת מחרוזת או אובייקט לכתובת מייל מעוצבת
 */
export function formatEmailAddress(
  address: string | EmailAddress
): string {
  if (typeof address === 'string') {
    return address;
  }
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

/**
 * המרת מערך כתובות למחרוזת מופרדת בפסיקים
 */
export function formatEmailAddresses(
  addresses: string | EmailAddress | Array<string | EmailAddress>
): string {
  if (typeof addresses === 'string') {
    return addresses;
  }

  if (Array.isArray(addresses)) {
    return addresses.map(formatEmailAddress).join(', ');
  }

  return formatEmailAddress(addresses);
}

/**
 * בדיקת תקינות כתובת מייל
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * חילוץ כתובת מייל מטקסט מעוצב (עם שם)
 * דוגמה: "John Doe <john@example.com>" -> "john@example.com"
 */
export function extractEmail(formattedAddress: string): string {
  const match = formattedAddress.match(/<([^>]+)>/);
  return match ? match[1] : formattedAddress.trim();
}

/**
 * קיצור כתובת מייל לתצוגה
 * דוגמה: "verylongemail@example.com" -> "verylong...@example.com"
 */
export function truncateEmail(email: string, maxLength: number = 30): string {
  if (email.length <= maxLength) return email;

  const [localPart, domain] = email.split('@');
  const availableLength = maxLength - domain.length - 4; // -4 for "...@"

  if (availableLength < 3) return email.substring(0, maxLength) + '...';

  return `${localPart.substring(0, availableLength)}...@${domain}`;
}

/**
 * המרת מערך מיילים למערך EmailAddress
 */
export function parseEmailList(
  emails: string,
  delimiter: string = ','
): EmailAddress[] {
  return emails
    .split(delimiter)
    .map((email) => email.trim())
    .filter((email) => isValidEmail(email))
    .map((email) => ({ email }));
}

/**
 * בדיקה אם מייל שייך לדומיין מסוים
 */
export function isEmailFromDomain(email: string, domain: string): boolean {
  const emailDomain = email.split('@')[1]?.toLowerCase();
  return emailDomain === domain.toLowerCase();
}

/**
 * הסרת כתובות מייל כפולות מרשימה
 */
export function uniqueEmails(
  addresses: Array<string | EmailAddress>
): Array<string | EmailAddress> {
  const seen = new Set<string>();
  return addresses.filter((addr) => {
    const email = typeof addr === 'string' ? addr : addr.email;
    if (seen.has(email.toLowerCase())) {
      return false;
    }
    seen.add(email.toLowerCase());
    return true;
  });
}

/**
 * המרת גודל קובץ לטקסט קריא
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * בדיקה אם סוג קובץ מותר לצירוף
 */
export function isAllowedAttachmentType(
  filename: string,
  allowedTypes: string[] = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'jpg',
    'jpeg',
    'png',
    'gif',
  ]
): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * יצירת placeholder לתוכן דינמי בתבניות
 */
export function replacePlaceholders(
  template: string,
  data: Record<string, any>
): string {
  let result = template;

  Object.keys(data).forEach((key) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(data[key] || ''));
  });

  return result;
}

/**
 * המרת HTML לטקסט רגיל (בסיסי)
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s\s+/g, ' ')
    .trim();
}

/**
 * בדיקת רכיב מייל בודד או מערך
 */
export function normalizeRecipients(
  recipients: string | string[] | EmailAddress | EmailAddress[]
): EmailAddress[] {
  if (typeof recipients === 'string') {
    return [{ email: recipients }];
  }

  if (Array.isArray(recipients)) {
    return recipients.map((r) =>
      typeof r === 'string' ? { email: r } : r
    );
  }

  return [recipients];
}

/**
 * יצירת subject מותאם לשפה
 */
export function localizeSubject(
  baseSubject: string,
  locale: 'he' | 'en',
  prefix?: { he: string; en: string }
): string {
  const localePrefix = prefix ? prefix[locale] + ' ' : '';
  return localePrefix + baseSubject;
}
