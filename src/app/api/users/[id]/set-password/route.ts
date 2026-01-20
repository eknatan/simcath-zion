/**
 * Set Password API Route
 * POST /api/users/[id]/set-password
 *
 * קביעת סיסמה ישירות למשתמש (ללא שליחת מייל)
 * שימושי למשתמשים מבוגרים או מאותגרים טכנולוגית
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק קביעת סיסמה
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, ensureServerSide } from '@/lib/supabase/admin';
import { requireManager } from '@/lib/utils/api-auth';
import { logUserAction } from '@/lib/utils/audit';
import { setPasswordSchema } from '@/lib/validation/user.schema';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/users/[id]/set-password
 * קביעת סיסמה למשתמש
 *
 * Flow:
 * 1. בדיקת הרשאות (רק מנהל)
 * 2. ולידציה של הסיסמה
 * 3. עדכון הסיסמה דרך Supabase Admin API
 * 4. רישום ב-audit log
 */
export async function POST(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  ensureServerSide();

  const { error: authError, supabase, user } = await requireManager();
  if (authError) return authError;

  try {
    // פרסור ו-ולידציה של body
    const body = await request.json();
    const validatedData = setPasswordSchema.parse(body);

    // קבלת פרטי המשתמש
    const { data: profile, error: profileError } = await supabase!
      .from('profiles')
      .select('email, name')
      .eq('id', params.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // עדכון הסיסמה דרך Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      params.id,
      { password: validatedData.password }
    );

    if (updateError) {
      console.error('Error setting password:', updateError);
      return NextResponse.json(
        { error: 'Failed to set password' },
        { status: 500 }
      );
    }

    // רישום ב-audit log (ללא הסיסמה עצמה!)
    await logUserAction(supabase!, {
      performed_by: user!.id,
      action: 'update',
      target_user_id: params.id,
      target_user_email: profile.email || undefined,
      changes: { action: { old: null, new: 'password_set_by_admin' } },
    });

    return NextResponse.json({
      message: 'Password set successfully',
    });
  } catch (err: any) {
    console.error('Error in POST /api/users/[id]/set-password:', err);

    // Zod validation errors
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: err.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
