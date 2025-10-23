/**
 * Reset Password API Route
 * POST /api/users/[id]/reset-password
 *
 * שולח לינק לאיפוס סיסמה למשתמש
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק שליחת לינק לאיפוס
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, ensureServerSide } from '@/lib/supabase/admin';
import { requireManager } from '@/lib/utils/api-auth';
import { logUserAction } from '@/lib/utils/audit';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/users/[id]/reset-password
 * שליחת לינק לאיפוס סיסמה
 *
 * Flow:
 * 1. בדיקת הרשאות (רק מנהל)
 * 2. קבלת אימייל המשתמש
 * 3. שליחת reset password email
 * 4. רישום ב-audit log
 */
export async function POST(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  ensureServerSide();

  const { error: authError, supabase, user } = await requireManager();
  if (authError) return authError;

  try {
    // קבלת פרטי המשתמש
    const { data: profile, error: profileError } = await supabase!
      .from('profiles')
      .select('email, name')
      .eq('id', params.id)
      .single();

    if (profileError || !profile || !profile.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // שליחת לינק לאיפוס סיסמה
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      profile.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      }
    );

    if (resetError) {
      console.error('Error sending reset password email:', resetError);
      return NextResponse.json(
        { error: 'Failed to send reset password email' },
        { status: 500 }
      );
    }

    // רישום ב-audit log
    await logUserAction(supabase!, {
      performed_by: user!.id,
      action: 'update',
      target_user_id: params.id,
      target_user_email: profile.email || undefined,
      changes: { action: { old: null, new: 'password_reset_sent' } },
    });

    return NextResponse.json({
      message: 'Reset password email sent successfully',
    });
  } catch (err: any) {
    console.error('Error in POST /api/users/[id]/reset-password:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
