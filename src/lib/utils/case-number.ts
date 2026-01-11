import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * מספרי התחלה לכל סוג תיק (ranges נפרדים למניעת התנגשויות)
 * - חתונות: 7000-49999
 * - ילדים חולים: 50000+
 */
export const CASE_NUMBER_START = {
  wedding: 7000,
  cleaning: 50000,
} as const;

/**
 * מחזיר את מספר התיק הבא לפי סוג התיק
 * @param supabase - Supabase client
 * @param caseType - סוג התיק (wedding או cleaning)
 * @returns מספר התיק הבא
 */
export async function getNextCaseNumber(
  supabase: SupabaseClient,
  caseType: 'wedding' | 'cleaning'
): Promise<number> {
  const startNumber = CASE_NUMBER_START[caseType];

  // Query only cases of this type to get the max case_number
  const { data, error } = await supabase
    .from('cases')
    .select('case_number')
    .eq('case_type', caseType)
    .order('case_number', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    console.error('Error fetching latest case number:', error);
    throw new Error('Failed to get next case number');
  }

  // אם אין תיקים מסוג זה, מתחיל מהמספר ההתחלתי
  if (!data) {
    return startNumber;
  }

  // אחרת, הבא
  return data.case_number + 1;
}
