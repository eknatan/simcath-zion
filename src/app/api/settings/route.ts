/**
 * API Route: System Settings
 * נתיב API לניהול הגדרות מערכת
 */

import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/settings/settings-service';
import { checkUserAuth } from '@/lib/email/auth-middleware';

/**
 * GET - שליפת כל ההגדרות או לפי קטגוריה
 */
export async function GET(request: NextRequest) {
  try {
    // בדיקת הרשאות
    const auth = await checkUserAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // קבלת קטגוריה מה-query params
    const category = request.nextUrl.searchParams.get('category');

    const settings = await settingsService.getAllSettings(
      category || undefined
    );

    return NextResponse.json({
      success: true,
      settings,
      total: settings.length,
    });
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - עדכון הגדרה ספציפית
 */
export async function PATCH(request: NextRequest) {
  try {
    // בדיקת הרשאות - רק מנהלים
    const auth = await checkUserAuth(request);
    if (!auth.authorized || auth.userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Only managers can update settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      );
    }

    const result = await settingsService.updateSetting(key, value);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Setting updated successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in PATCH /api/settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
