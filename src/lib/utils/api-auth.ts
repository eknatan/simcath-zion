/**
 * API Authentication & Authorization Utilities
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק בדיקות הרשאות
 * - Dependency Inversion: עובד עם ממשק Supabase Client
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * בדיקת אימות ו הרשאת מנהל
 *
 * @returns { supabase, user } - אם מורשה
 * @throws NextResponse - אם לא מאומת או לא מורשה
 */
export async function requireManager() {
  const supabase = await createClient();

  // בדיקת אימות (באמצעות getUser לאבטחה)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      supabase: null,
      user: null,
      profile: null,
    };
  }

  // בדיקת role מתוך user metadata (כדי למנוע בעיות RLS)
  const userRole = user.user_metadata?.role;

  if (!userRole) {
    return {
      error: NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      ),
      supabase: null,
      user: null,
      profile: null,
    };
  }

  if (userRole !== 'manager') {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Manager role required' },
        { status: 403 }
      ),
      supabase: null,
      user: null,
      profile: null,
    };
  }

  // בדיקת סטטוס מה-profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      ),
      supabase: null,
      user: null,
      profile: null,
    };
  }

  if (profile.status !== 'active') {
    return {
      error: NextResponse.json(
        { error: 'Account suspended' },
        { status: 403 }
      ),
      supabase: null,
      user: null,
      profile: null,
    };
  }

  return {
    error: null,
    supabase,
    user,
    profile,
  };
}

/**
 * בדיקה שהמנהל לא האחרון לפני הדחה/מחיקה
 *
 * @param supabase - Supabase client
 * @param targetUserId - ID של המשתמש שרוצים למחוק/להדיח
 * @param currentUserId - ID של המנהל המבצע
 * @returns true אם בטוח למחוק, false אחרת
 */
export async function canRemoveManager(
  supabase: SupabaseClient,
  targetUserId: string
): Promise<{ canRemove: boolean; error?: string }> {
  // בדיקה אם המשתמש היעד הוא מנהל
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', targetUserId)
    .single();

  // אם לא מנהל, אפשר למחוק
  if (!targetProfile || targetProfile.role !== 'manager') {
    return { canRemove: true };
  }

  // ספירת מנהלים פעילים (לא כולל את היעד)
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'manager')
    .eq('status', 'active')
    .neq('id', targetUserId);

  if (count === null || count < 1) {
    return {
      canRemove: false,
      error: 'Cannot remove the last active manager',
    };
  }

  return { canRemove: true };
}
