/**
 * Audit Log Middleware
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק רישום שינויים ב-case_history
 * - Open/Closed: קל להוסיף סוגי שינויים חדשים
 * - Dependency Inversion: תלוי רק ב-Supabase client
 */

import type { SupabaseClient } from '@supabase/supabase-js';

interface LogCaseChangeParams {
  caseId: string;
  changedBy: string;
  fieldChanged: string;
  oldValue?: string | null;
  newValue?: string | null;
  note?: string | null;
}

/**
 * רישום שינוי ב-Case History
 *
 * @param supabase - Supabase client
 * @param params - פרטי השינוי
 * @returns Promise<void>
 */
export async function logCaseChange(
  supabase: SupabaseClient,
  {
    caseId,
    changedBy,
    fieldChanged,
    oldValue,
    newValue,
    note
  }: LogCaseChangeParams
): Promise<void> {
  try {
    const { error } = await supabase.from('case_history').insert({
      case_id: caseId,
      changed_by: changedBy,
      field_changed: fieldChanged,
      old_value: oldValue,
      new_value: newValue,
      note: note || generateDefaultNote(fieldChanged, oldValue, newValue),
      changed_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to log case change:', error);
      // לא לזרוק שגיאה - audit log failure לא צריך לקרוס את הפעולה
    }
  } catch (err) {
    console.error('Unexpected error logging case change:', err);
  }
}

/**
 * רישום מספר שינויים בבת אחת (לעדכונים מרובים)
 *
 * @param supabase - Supabase client
 * @param caseId - מזהה התיק
 * @param changedBy - מי שביצע את השינוי
 * @param changes - אובייקט של שינויים { field: { old, new } }
 */
export async function logMultipleCaseChanges(
  supabase: SupabaseClient,
  caseId: string,
  changedBy: string,
  changes: Record<string, { old?: any; new?: any }>
): Promise<void> {
  const historyEntries = Object.entries(changes).map(([field, change]) => ({
    case_id: caseId,
    changed_by: changedBy,
    field_changed: field,
    old_value: change.old ? String(change.old) : null,
    new_value: change.new ? String(change.new) : null,
    note: generateDefaultNote(field, change.old, change.new),
    changed_at: new Date().toISOString(),
  }));

  try {
    const { error } = await supabase.from('case_history').insert(historyEntries);

    if (error) {
      console.error('Failed to log multiple case changes:', error);
    }
  } catch (err) {
    console.error('Unexpected error logging multiple case changes:', err);
  }
}

/**
 * רישום פעולה כללית על התיק
 *
 * @param supabase - Supabase client
 * @param caseId - מזהה התיק
 * @param changedBy - מי שביצע את הפעולה
 * @param action - סוג הפעולה (status_change, file_upload, payment_approval, וכו')
 * @param details - פרטים נוספים על הפעולה
 */
export async function logCaseAction(
  supabase: SupabaseClient,
  caseId: string,
  changedBy: string,
  action: string,
  details?: {
    oldValue?: string | null;
    newValue?: string | null;
    note?: string | null;
  }
): Promise<void> {
  await logCaseChange(supabase, {
    caseId,
    changedBy,
    fieldChanged: action,
    oldValue: details?.oldValue,
    newValue: details?.newValue,
    note: details?.note,
  });
}

/**
 * יצירת הערת ברירת מחדל לפי סוג השינוי
 */
function generateDefaultNote(
  field: string,
  oldValue?: string | null,
  newValue?: string | null
): string {
  const fieldLower = field.toLowerCase();

  // Special cases
  switch (fieldLower) {
    case 'status':
      return `שינה סטטוס מ"${oldValue}" ל"${newValue}"`;
    case 'file_uploaded':
      return `העלה קובץ: ${newValue}`;
    case 'file_deleted':
      return `מחק קובץ: ${oldValue}`;
    case 'payment_approved':
      return 'אישור תשלום ושינוי סטטוס לממתין להעברה';
    case 'bank_details':
      return 'עדכון פרטי חשבון בנק';
    default:
      if (oldValue && newValue) {
        return `עדכון ${field} מ"${oldValue}" ל"${newValue}"`;
      } else if (newValue && !oldValue) {
        return `הוספת ${field}: ${newValue}`;
      } else if (oldValue && !newValue) {
        return `הסרת ${field}: ${oldValue}`;
      }
      return `פעולה על ${field}`;
  }
}

/**
 * פונקציית עזר להשוואת אובייקטים ומציאת השינויים
 *
 * @param oldData - נתונים ישנים
 * @param newData - נתונים חדשים
 * @returns אובייקט עם השינויים בלבד
 */
export function getChangedFields<T extends Record<string, any>>(
  oldData: Partial<T>,
  newData: Partial<T>
): Record<string, { old?: any; new?: any }> {
  const changes: Record<string, { old?: any; new?: any }> = {};

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

/**
 * Hook לשימוש קל ב-API routes
 *
 * @param request - NextRequest או Supabase client
 * @returns פונקציות לרישום שינויים
 */
export function createAuditLogger(supabase: SupabaseClient) {
  return {
    logChange: (params: Omit<LogCaseChangeParams, 'changedBy'> & { changedBy?: string }) => {
      // אם לא סופק changedBy, נניח שזה משתמש מחובר
      return logCaseChange(supabase, params as LogCaseChangeParams);
    },

    logMultipleChanges: (
      caseId: string,
      changedBy: string,
      changes: Record<string, { old?: any; new?: any }>
    ) => logMultipleCaseChanges(supabase, caseId, changedBy, changes),

    logAction: (
      caseId: string,
      changedBy: string,
      action: string,
      details?: { oldValue?: string; newValue?: string; note?: string }
    ) => logCaseAction(supabase, caseId, changedBy, action, details),
  };
}