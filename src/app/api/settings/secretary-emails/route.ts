/**
 * API Route: Secretary Emails Settings
 * נתיב API לניהול מיילי מזכירות
 */

import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/settings/settings-service';
import { checkUserAuth } from '@/lib/email/auth-middleware';
import { z } from 'zod';

// סכמת ולידציה
const updateEmailsSchema = z.object({
  emails: z
    .array(z.string().email('כתובת מייל לא תקינה'))
    .min(1, 'חייב להיות לפחות מייל אחד')
    .max(10, 'מקסימום 10 כתובות מייל'),
});

/**
 * GET - שליפת רשימת מיילי מזכירות
 */
export async function GET(request: NextRequest) {
  try {
    // בדיקת הרשאות
    const auth = await checkUserAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emails = await settingsService.getSecretaryEmails();

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
    });
  } catch (error) {
    console.error('Error in GET /api/settings/secretary-emails:', error);
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
 * PUT - עדכון רשימת מיילי מזכירות
 */
export async function PUT(request: NextRequest) {
  try {
    // בדיקת הרשאות - רק מנהלים
    const auth = await checkUserAuth(request);
    if (!auth.authorized || auth.userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Only managers can update secretary emails' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // ולידציה
    const validation = updateEmailsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await settingsService.updateSecretaryEmails(
      validation.data.emails
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Secretary emails updated successfully',
        emails: validation.data.emails,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in PUT /api/settings/secretary-emails:', error);
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
 * POST - הוספת מייל למזכירות
 */
export async function POST(request: NextRequest) {
  try {
    // בדיקת הרשאות - רק מנהלים
    const auth = await checkUserAuth(request);
    if (!auth.authorized || auth.userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Only managers can add secretary emails' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // ולידציה
    const emailSchema = z.string().email();
    const validation = emailSchema.safeParse(email);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // קבלת הרשימה הנוכחית
    const currentEmails = await settingsService.getSecretaryEmails();

    // בדיקה אם המייל כבר קיים
    if (currentEmails.includes(validation.data)) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // הוספת המייל החדש
    const updatedEmails = [...currentEmails, validation.data];
    const result = await settingsService.updateSecretaryEmails(updatedEmails);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email added successfully',
        emails: updatedEmails,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/settings/secretary-emails:', error);
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
 * DELETE - מחיקת מייל מהמזכירות
 */
export async function DELETE(request: NextRequest) {
  try {
    // בדיקת הרשאות - רק מנהלים
    const auth = await checkUserAuth(request);
    if (!auth.authorized || auth.userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Only managers can delete secretary emails' },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // קבלת הרשימה הנוכחית
    const currentEmails = await settingsService.getSecretaryEmails();

    // בדיקה שנשאר לפחות מייל אחד
    if (currentEmails.length <= 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete the last secretary email',
        },
        { status: 400 }
      );
    }

    // מחיקת המייל
    const updatedEmails = currentEmails.filter((e) => e !== email);

    if (updatedEmails.length === currentEmails.length) {
      return NextResponse.json(
        { success: false, error: 'Email not found' },
        { status: 404 }
      );
    }

    const result = await settingsService.updateSecretaryEmails(updatedEmails);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email deleted successfully',
        emails: updatedEmails,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE /api/settings/secretary-emails:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
