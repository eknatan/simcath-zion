/**
 * Suspend User API Route
 * POST /api/users/[id]/suspend
 *
 * השהיית משתמש (שינוי status ל-suspended)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireManager, canRemoveManager } from '@/lib/utils/api-auth';
import { logUserAction } from '@/lib/utils/audit';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  const { error: authError, supabase, user } = await requireManager();
  if (authError) return authError;

  try {
    // קריאת פרופיל נוכחי
    const { data: profile, error: fetchError } = await supabase!
      .from('profiles')
      .select('id, email, name, role, status')
      .eq('id', params.id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // בדיקה אם אפשר להשהות (אם זה מנהל)
    if (profile.role === 'manager') {
      const { canRemove, error: removeError } = await canRemoveManager(
        supabase!,
        params.id
      );

      if (!canRemove) {
        return NextResponse.json(
          { error: removeError || 'Cannot suspend the last active manager' },
          { status: 400 }
        );
      }
    }

    // עדכון סטטוס
    const { data: updated, error: updateError } = await supabase!
      .from('profiles')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error suspending user:', updateError);
      return NextResponse.json(
        { error: 'Failed to suspend user' },
        { status: 500 }
      );
    }

    // רישום ב-audit log
    await logUserAction(supabase!, {
      performed_by: user!.id,
      action: 'suspend',
      target_user_id: params.id,
      target_user_email: profile.email || undefined,
      changes: {
        status: { old: profile.status, new: 'suspended' },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Error in POST /api/users/[id]/suspend:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
