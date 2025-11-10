/**
 * Notification Utilities with i18n support
 *
 * Wrapper around sonner toast with internationalization.
 * Use this instead of direct toast calls to ensure i18n compliance.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles notifications
 * - Dependency Inversion: Abstracts toast implementation
 */

import { toast } from 'sonner';

/**
 * Show success notification
 * @param message - Translation key or translated message
 * @param options - Additional toast options
 */
export function notifySuccess(message: string, options?: { description?: string }) {
  toast.success(message, options);
}

/**
 * Show error notification
 * @param message - Translation key or translated message
 * @param options - Additional toast options
 */
export function notifyError(message: string, options?: { description?: string }) {
  toast.error(message, options);
}

/**
 * Show info notification
 * @param message - Translation key or translated message
 * @param options - Additional toast options
 */
export function notifyInfo(message: string, options?: { description?: string }) {
  toast.info(message, options);
}

/**
 * Show loading notification
 * @param message - Translation key or translated message
 * @returns Toast ID for dismissal
 */
export function notifyLoading(message: string): string | number {
  return toast.loading(message);
}

/**
 * Dismiss notification
 * @param toastId - ID returned from notifyLoading
 */
export function dismissNotification(toastId?: string | number) {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
}
