/**
 * Users API Route
 * GET /api/users - רשימת משתמשים
 * POST /api/users - הזמנת משתמש חדש
 *
 * עקרונות SOLID:
 * - Single Responsibility: כל function מטפלת ב-HTTP method אחד
 * - Dependency Inversion: תלוי ב-interfaces ולא במימושים
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, ensureServerSide } from '@/lib/supabase/admin';
import { requireManager } from '@/lib/utils/api-auth';
import { createUserSchema, userFiltersSchema } from '@/lib/validation/user.schema';
import { logUserAction } from '@/lib/utils/audit';
import type { Profile } from '@/types/user.types';

/**
 * GET /api/users
 * רשימת כל המשתמשים (רק למנהלים)
 *
 * Query Params:
 * - search: חיפוש חופשי בשם/אימייל
 * - role: סינון לפי תפקיד
 * - status: סינון לפי סטטוס
 * - page: מספר עמוד (ברירת מחדל: 1)
 * - limit: כמות לעמוד (ברירת מחדל: 10, מקסימום: 100)
 */
export async function GET(request: NextRequest) {
  // בדיקת הרשאות
  const { error: authError, supabase } = await requireManager();
  if (authError) return authError;

  try {
    // פרסור query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const filters = userFiltersSchema.parse(searchParams);

    const { search, role, status, page, limit } = filters;
    const offset = (page - 1) * limit;

    // בניית שאילתה עם סינונים
    let query = supabase!
      .from('profiles')
      .select('*', { count: 'exact' });

    // חיפוש טקסט חופשי
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // סינון לפי role
    if (role) {
      query = query.eq('role', role);
    }

    // סינון לפי status
    if (status) {
      query = query.eq('status', status);
    }

    // מיון ו-pagination
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users as Profile[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/users:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * הזמנת משתמש חדש (רק למנהלים)
 *
 * Body:
 * - email: כתובת אימייל (חובה, ייחודית)
 * - name: שם מלא (חובה)
 * - role: תפקיד (secretary/manager)
 * - phone: טלפון (אופציונלי)
 * - notes: הערות (אופציונלי)
 *
 * Flow:
 * 1. ולידציה
 * 2. יצירת user ב-auth.users (שולח invite email)
 * 3. ה-trigger יוצר profile אוטומטית
 * 4. עדכון שדות נוספים (phone, notes)
 * 5. רישום ב-audit log
 */
export async function POST(request: NextRequest) {
  ensureServerSide();

  // בדיקת הרשאות
  const { error: authError, supabase, user } = await requireManager();
  if (authError) return authError;

  try {
    // פרסור ו-ולידציה של body
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const { email, name, role, phone, notes } = validatedData;

    // יצירת משתמש ב-Auth (שולח invite email)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          role,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      }
    );

    if (authError) {
      // טיפול בשגיאות ספציפיות
      if (authError.message.includes('already')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      console.error('Auth error creating user:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // המתנה קצרה לתת ל-trigger לרוץ
    await new Promise((resolve) => setTimeout(resolve, 500));

    // עדכון שדות נוספים ב-profile
    if (phone || notes) {
      const { error: profileError } = await supabase!
        .from('profiles')
        .update({
          phone: phone || null,
          notes: notes || null,
        })
        .eq('id', authUser.user.id);

      if (profileError) {
        console.error('Error updating profile fields:', profileError);
        // לא להחזיר שגיאה - המשתמש נוצר בהצלחה
      }
    }

    // רישום ב-audit log
    await logUserAction(supabase!, {
      performed_by: user!.id,
      action: 'invite',
      target_user_id: authUser.user.id,
      target_user_email: email,
      changes: {
        name: { old: null, new: name },
        role: { old: null, new: role },
        ...(phone && { phone: { old: null, new: phone } }),
        ...(notes && { notes: { old: null, new: notes } }),
      },
    });

    return NextResponse.json(
      {
        message: 'User invited successfully',
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Unexpected error in POST /api/users:', err);

    // Zod validation errors
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: err.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
