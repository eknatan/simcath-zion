/**
 * Payment Helper Functions
 * פונקציות עזר לטיפול בתשלומים - ילדים חולים
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק פונקציות תשלום
 */

import { createClient } from '@/lib/supabase/server';

/**
 * קבלת תקרת תשלום חודשי מהגדרות המערכת
 * @returns תקרת תשלום ב-ILS (ברירת מחדל: 720)
 */
export async function getMonthlyCapFromSettings(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'cleaning_monthly_cap')
      .single();

    if (error || !data) {
      console.warn('Failed to fetch monthly cap, using default:', error);
      return 720; // Default value
    }

    // setting_value is JSONB, can be a number or object
    const value =
      typeof data.setting_value === 'number'
        ? data.setting_value
        : Number(data.setting_value);

    return value > 0 ? value : 720;
  } catch (error) {
    console.error('Error fetching monthly cap:', error);
    return 720;
  }
}

/**
 * בדיקה האם קיים תשלום לחודש מסוים
 * @param caseId - מזהה התיק
 * @param month - תאריך (יום 1 בחודש)
 * @returns true אם קיים תשלום
 */
export async function hasPaymentForMonth(
  caseId: string,
  month: Date
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Format to YYYY-MM-01
    const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from('payments')
      .select('id')
      .eq('case_id', caseId)
      .eq('payment_type', 'monthly_cleaning')
      .eq('payment_month', monthStr)
      .maybeSingle();

    if (error) {
      console.error('Error checking payment:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasPaymentForMonth:', error);
    return false;
  }
}

/**
 * קבלת תשלומי חודש נוכחי לכל המשפחות
 * @param caseIds - מזהי תיקים
 * @returns Map של case_id -> payment או null
 */
export async function getCurrentMonthPayments(
  caseIds: string[]
): Promise<Map<string, any>> {
  try {
    const supabase = await createClient();
    const currentDate = new Date();
    const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .in('case_id', caseIds)
      .eq('payment_type', 'monthly_cleaning')
      .eq('payment_month', monthStr);

    if (error) {
      console.error('Error fetching current month payments:', error);
      return new Map();
    }

    const paymentsMap = new Map();
    data?.forEach((payment) => {
      paymentsMap.set(payment.case_id, payment);
    });

    return paymentsMap;
  } catch (error) {
    console.error('Error in getCurrentMonthPayments:', error);
    return new Map();
  }
}
