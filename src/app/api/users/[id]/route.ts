/**
 * User by ID API Route
 * GET /api/users/[id] - פרטי משתמש
 * PATCH /api/users/[id] - עדכון משתמש
 * DELETE /api/users/[id] - מחיקת משתמש
 *
 * עקרונות SOLID:
 * - Single Responsibility: כל HTTP method מטפל בפעולה אחת
 * - Open/Closed: ניתן להוסיף validations בלי לשנות קוד קיים
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, ensureServerSide } from '@/lib/supabase/admin';
import { requireManager, canRemoveManager } from '@/lib/utils/api-auth';
import { updateUserSchema } from '@/lib/validation/user.schema';
import { logUserAction, createChangesObject } from '@/lib/utils/audit';
import type { Profile } from '@/types/user.types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/users/[id]
 * קבלת פרטי משתמש ספציפי
 */
export async function GET(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  const { error: authError, supabase } = await requireManager();
  if (authError) return authError;

  try {
    const { data: user, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user as Profile);
  } catch (err: any) {
    console.error('Error in GET /api/users/[id]:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * עדכון משתמש קיים
 *
 * Body (כל השדות אופציונליים):
 * - name: שם מלא
 * - role: תפקיד
 * - status: סטטוס
 * - phone: טלפון
 * - notes: הערות
 *
 * בדיקות:
 * - אם משנים role מ-manager, לוודא שיש עוד מנהל פעיל
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  const { error: authError, supabase, user } = await requireManager();
  if (authError) return authError;

  try {
    // קריאת נתונים ישנים
    const { data: oldProfile, error: fetchError } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !oldProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // פרסור ו-ולידציה
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // בדיקה: אם משנים role ל-לא-מנהל, לוודא שזה לא המנהל האחרון
    if (
      validatedData.role &&
      validatedData.role !== 'manager' &&
      oldProfile.role === 'manager'
    ) {
      const { canRemove, error: removeError } = await canRemoveManager(
        supabase!,
        params.id
      );

      if (!canRemove) {
        return NextResponse.json({ error: removeError }, { status: 400 });
      }
    }

    // עדכון
    const updateData: any = { ...validatedData, updated_at: new Date().toISOString() };

    const { data: updatedProfile, error: updateError } = await supabase!
      .from('profiles')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // יצירת changes object ל-audit log
    const changes = createChangesObject(oldProfile, validatedData);

    // רישום ב-audit log
    await logUserAction(supabase!, {
      performed_by: user!.id,
      action: 'update',
      target_user_id: params.id,
      target_user_email: oldProfile.email || undefined,
      changes,
    });

    return NextResponse.json(updatedProfile as Profile);
  } catch (err: any) {
    console.error('Error in PATCH /api/users/[id]:', err);

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

/**
 * DELETE /api/users/[id]
 * מחיקת משתמש
 *
 * בדיקות:
 * - לא למחוק את עצמך אם אתה המנהל האחרון
 * - מחיקה מ-auth.users תוביל למחיקה אוטומטית מ-profiles (trigger)
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  ensureServerSide();

  const { error: authError, supabase, user } = await requireManager();
  if (authError) return authError;

  try {
    // קריאת פרופיל המשתמש
    const { data: targetProfile, error: fetchError } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // בדיקה אם אפשר למחוק (אם זה מנהל)
    const { canRemove, error: removeError } = await canRemoveManager(
      supabase!,
      params.id
    );

    if (!canRemove) {
      return NextResponse.json({ error: removeError }, { status: 400 });
    }

    // מחיקה מ-auth.users (ה-trigger ימחק מ-profiles אוטומטית)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      params.id
    );

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // רישום ב-audit log
    await logUserAction(supabase!, {
      performed_by: user!.id,
      action: 'delete',
      target_user_id: params.id,
      target_user_email: targetProfile.email || undefined,
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('Error in DELETE /api/users/[id]:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
