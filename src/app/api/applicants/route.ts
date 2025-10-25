import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { weddingFormSchema } from '@/lib/validations/wedding-form.schema';
import { z } from 'zod';

/**
 * API Route: POST /api/applicants
 *
 * מטפל בשליחת טפסים חיצוניים (חתונות וניקיון)
 *
 * עקרונות SOLID:
 * - Single Responsibility: מטפל רק בקבלת ושמירת בקשות
 * - Dependency Inversion: משתמש ב-Supabase דרך abstraction
 * - Interface Segregation: מקבל רק את הנתונים הנדרשים
 *
 * תהליך:
 * 1. Validation של הנתונים עם Zod
 * 2. שמירה ב-DB (טבלת applicants)
 * 3. שליחת מייל אוטומטי למזכירות (case-created)
 * 4. שליחת מייל אישור למבקש (applicant-notification)
 * 5. החזרת תגובה למשתמש
 */

/**
 * Helper: Send notification emails for new applicant
 */
async function sendApplicantEmails(data: {
  applicantId: string;
  caseType: string;
  formData: any;
  locale: 'he' | 'en';
}): Promise<{ secretaryEmailSent: boolean; applicantEmailSent: boolean }> {
  const { applicantId, caseType, formData, locale } = data;

  let secretaryEmailSent = false;
  let applicantEmailSent = false;

  try {
    // 1. Send email to secretary (case-created template)
    // The /api/email/send will automatically use secretary emails from DB
    const secretaryResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': process.env.INTERNAL_EMAIL_API_KEY || '',
      },
      body: JSON.stringify({
        type: 'case-created',
        // to: undefined, // Let it use default secretary emails
        data: {
          caseNumber: applicantId.substring(0, 8).toUpperCase(), // Short reference code
          caseType: caseType, // Send original value: 'wedding' or 'cleaning'
          applicantName: formData.personal_info?.full_name || 'לא צוין',
          applicantEmail: formData.personal_info?.email || undefined,
          applicantPhone: formData.personal_info?.phone || undefined,
          caseUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/applicants/${applicantId}`,
        },
        locale,
      }),
    });

    secretaryEmailSent = secretaryResponse.ok;
    if (!secretaryEmailSent) {
      console.error('Failed to send secretary email:', await secretaryResponse.text());
    }

    // 2. Send confirmation email to applicant (applicant-notification template)
    if (formData.personal_info?.email) {
      const applicantResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.INTERNAL_EMAIL_API_KEY || '',
        },
        body: JSON.stringify({
          type: 'applicant-notification',
          to: [formData.personal_info.email],
          data: {
            applicantName: formData.personal_info.full_name || 'שלום',
            caseType: caseType === 'wedding' ? 'חתונה' : 'ילד חולה',
            referenceNumber: applicantId.substring(0, 8).toUpperCase(),
          },
          locale,
        }),
      });

      applicantEmailSent = applicantResponse.ok;
      if (!applicantEmailSent) {
        console.error('Failed to send applicant email:', await applicantResponse.text());
      }
    }
  } catch (error) {
    console.error('Error sending emails:', error);
  }

  return { secretaryEmailSent, applicantEmailSent };
}

// Schema לבקשה
const applicantRequestSchema = z.object({
  case_type: z.enum(['wedding', 'cleaning']),
  form_data: z.union([weddingFormSchema, z.any()]), // TODO: Add cleaning schema
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request data
    const validationResult = applicantRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { case_type, form_data } = validationResult.data;

    // Create Supabase client
    const supabase = await createClient();

    // Insert into applicants table
    const { data, error } = await supabase
      .from('applicants')
      .insert({
        case_type,
        form_data,
        email_sent_to_secretary: false, // Will be updated after email is sent
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        {
          error: 'Failed to save application',
          details: error?.message || 'No data returned',
        },
        { status: 500 }
      );
    }

    // Send notification emails (non-blocking)
    const locale = (form_data.locale || 'he') as 'he' | 'en';
    const emailResults = await sendApplicantEmails({
      applicantId: data.id,
      caseType: case_type,
      formData: form_data,
      locale,
    });

    // Update email_sent_to_secretary flag
    if (emailResults.secretaryEmailSent) {
      await supabase
        .from('applicants')
        .update({ email_sent_to_secretary: true })
        .eq('id', data.id);
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully',
        data: {
          id: data.id,
          reference: data.id.substring(0, 8).toUpperCase(),
        },
        emails: {
          secretaryNotified: emailResults.secretaryEmailSent,
          applicantNotified: emailResults.applicantEmailSent,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/applicants
 *
 * מחזיר רשימת בקשות ממתינות (למזכירות בלבד)
 * TODO: Add authentication middleware
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseType = searchParams.get('case_type');
    const status = searchParams.get('status');

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('applicants')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (caseType) {
      query = query.eq('case_type', caseType);
    }

    if (status === 'pending') {
      query = query.eq('email_sent_to_secretary', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch applications',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
