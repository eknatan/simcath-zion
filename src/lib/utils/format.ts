/**
 * Formatting utilities for dates, currency, and other display values
 */

/**
 * Format currency in ILS (Israeli Shekel)
 */
export function formatCurrency(amount: number, locale: string = 'he-IL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency in USD
 */
export function formatUSD(amount: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format Hebrew date (placeholder - can be enhanced with actual Hebrew calendar)
 */
export function formatHebrewDate(dateString: string): string {
  // For now, just return the string as-is
  // In Phase 2+, we can integrate with Hebcal or other Hebrew calendar libraries
  return dateString;
}

/**
 * Format Gregorian date in Hebrew locale
 */
export function formatDate(dateString: string, locale: string = 'he-IL'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date as short format
 */
export function formatDateShort(dateString: string, locale: string = 'he-IL'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format phone number (Israeli format)
 */
export function formatPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format as 050-1234567 or 02-1234567
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  } else if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }

  return phone; // Return as-is if doesn't match expected format
}

/**
 * Format Israeli ID number (with dashes)
 */
export function formatID(id: string): string {
  // Format as 123-456-789
  const cleaned = id.replace(/\D/g, '');

  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return id; // Return as-is if doesn't match expected format
}
