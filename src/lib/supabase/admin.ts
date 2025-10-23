/**
 * Supabase Admin Client
 *
 * ⚠️ SECURITY WARNING:
 * - קובץ זה משתמש ב-SERVICE_ROLE_KEY
 * - לשימוש בצד השרת בלבד!
 * - לעולם אל תחשוף את המפתח הזה לקליינט
 *
 * עקרונות SOLID:
 * - Dependency Inversion: ממשק נפרד למנהל מהמשתמש הרגיל
 * - Single Responsibility: רק פעולות אדמין
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// בדיקת קיום משתני סביבה
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Supabase Admin Client
 *
 * יכולות:
 * - יצירת משתמשים חדשים
 * - מחיקת משתמשים
 * - שליחת הזמנות
 * - איפוס סיסמאות
 * - עוקף RLS policies
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Helper: בדיקה שהקוד רץ בצד השרת
 * למניעת שימוש בטעות בקליינט
 */
export function ensureServerSide(): void {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin can only be used server-side');
  }
}
