/**
 * Audit Log Utilities
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק לוגיקת audit logging
 * - Open/Closed: ניתן להוסיף סוגי פעולות חדשות
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserAction } from '@/types/user.types';

interface LogUserActionParams {
  performed_by: string;
  action: UserAction;
  target_user_id: string;
  target_user_email?: string;
  changes?: Record<string, { old: any; new: any }>;
}

/**
 * רישום פעולה ב-Audit Log
 *
 * @param supabase - Supabase client (רגיל או admin)
 * @param params - פרטי הפעולה לרישום
 */
export async function logUserAction(
  supabase: SupabaseClient,
  params: LogUserActionParams
): Promise<void> {
  try {
    const { error } = await supabase.from('user_audit_log').insert({
      performed_by: params.performed_by,
      action: params.action,
      target_user_id: params.target_user_id,
      target_user_email: params.target_user_email || null,
      changes: params.changes || null,
    });

    if (error) {
      console.error('Failed to log user action:', error);
      // לא לזרוק שגיאה - audit log failure לא צריך לקרוס את הפעולה
    }
  } catch (err) {
    console.error('Unexpected error logging user action:', err);
  }
}

/**
 * יצירת changes object להשוואה
 *
 * @param oldData - נתונים ישנים
 * @param newData - נתונים חדשים
 * @returns אובייקט השוואה של שינויים
 */
export function createChangesObject<T extends Record<string, any>>(
  oldData: Partial<T>,
  newData: Partial<T>
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};

  for (const key in newData) {
    if (newData[key] !== oldData[key]) {
      changes[key] = {
        old: oldData[key],
        new: newData[key],
      };
    }
  }

  return changes;
}
