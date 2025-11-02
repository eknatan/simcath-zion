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

  console.log('📨 [APPLICANTS] Starting to send emails for applicant:', applicantId);
  console.log('📨 [APPLICANTS] Case type:', caseType, 'Locale:', locale);

  let secretaryEmailSent = false;
  let applicantEmailSent = false;

  try {
    // 1. Send email to secretary (case-created template)
    // The /api/email/send will automatically use secretary emails from DB
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const apiKey = process.env.INTERNAL_EMAIL_API_KEY;

    console.log('📨 [APPLICANTS] Email API config:', {
      baseUrl,
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey?.length || 0
    });

    console.log('📨 [APPLICANTS] Sending secretary email...');
    const secretaryResponse = await fetch(`${baseUrl}/api/email/send`, {
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
          applicantName: caseType === 'wedding'
            ? `${formData.groom_info?.first_name || ''} ${formData.groom_info?.last_name || ''}`.trim() || 'לא צוין'
            : formData.personal_info?.full_name || 'לא צוין',
          applicantEmail: caseType === 'wedding'
            ? formData.groom_info?.email
            : formData.personal_info?.email,
          applicantPhone: caseType === 'wedding'
            ? formData.groom_info?.phone
            : formData.personal_info?.phone,
          caseUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/applicants/${applicantId}`,
          fullFormData: formData, // Send entire form data for detailed email
        },
        locale,
      }),
    });

    secretaryEmailSent = secretaryResponse.ok;
    console.log('📨 [APPLICANTS] Secretary email response:', {
      ok: secretaryResponse.ok,
      status: secretaryResponse.status,
      statusText: secretaryResponse.statusText
    });

    if (!secretaryEmailSent) {
      const errorText = await secretaryResponse.text();
      console.error('❌ [APPLICANTS] Failed to send secretary email:', errorText);
    } else {
      const responseData = await secretaryResponse.json();
      console.log('✅ [APPLICANTS] Secretary email sent successfully:', responseData);
    }

    // 2. Send confirmation email to applicant (applicant-notification template)
    // Get applicant email based on case type
    const applicantEmail = caseType === 'wedding'
      ? formData.groom_info?.email
      : formData.personal_info?.email;

    const applicantName = caseType === 'wedding'
      ? `${formData.groom_info?.first_name || ''} ${formData.groom_info?.last_name || ''}`.trim() || 'שלום'
      : formData.personal_info?.full_name || 'שלום';

    if (applicantEmail) {
      console.log('📨 [APPLICANTS] Sending applicant confirmation email to:', applicantEmail);
      const applicantResponse = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.INTERNAL_EMAIL_API_KEY || '',
        },
        body: JSON.stringify({
          type: 'applicant-notification',
          to: [applicantEmail],
          data: {
            applicantName,
            caseType: caseType === 'wedding' ? 'חתונה' : 'ילד חולה',
            referenceNumber: applicantId.substring(0, 8).toUpperCase(),
          },
          locale,
        }),
      });

      applicantEmailSent = applicantResponse.ok;
      console.log('📨 [APPLICANTS] Applicant email response:', {
        ok: applicantResponse.ok,
        status: applicantResponse.status,
        statusText: applicantResponse.statusText
      });

      if (!applicantEmailSent) {
        const errorText = await applicantResponse.text();
        console.error('❌ [APPLICANTS] Failed to send applicant email:', errorText);
      } else {
        const responseData = await applicantResponse.json();
        console.log('✅ [APPLICANTS] Applicant email sent successfully:', responseData);
      }
    } else {
      console.log('⚠️ [APPLICANTS] No applicant email found, skipping applicant notification');
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
        status: 'pending_approval', // Explicitly set status
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
 * מחזיר רשימת בקשות (למזכירות בלבד)
 *
 * Query Params:
 * - case_type: 'wedding' | 'cleaning'
 * - status: 'pending_approval' | 'rejected' | 'approved'
 * - search: string (חיפוש טקסט חופשי)
 * - city: string (סינון לפי עיר)
 * - sort_by: 'created_at' | 'wedding_date_gregorian'
 * - sort_order: 'asc' | 'desc'
 * - page: number (pagination)
 * - limit: number (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseType = searchParams.get('case_type');
    const status = searchParams.get('status') || 'pending_approval'; // Default to pending
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = await createClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('applicants')
      .select('*', { count: 'exact' });

    // Apply filters
    if (caseType) {
      query = query.eq('case_type', caseType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (city) {
      query = query.ilike('form_data->wedding_info->>city', `%${city}%`);
    }

    // Search in groom/bride names (for wedding cases)
    if (search && search.trim()) {
      query = query.or(
        `form_data->groom_info->>first_name.ilike.%${search}%,` +
        `form_data->groom_info->>last_name.ilike.%${search}%,` +
        `form_data->bride_info->>first_name.ilike.%${search}%,` +
        `form_data->bride_info->>last_name.ilike.%${search}%`
      );
    }

    // Sorting
    const ascending = sortOrder === 'asc';
    if (sortBy === 'wedding_date_gregorian') {
      query = query.order('form_data->wedding_info->date_gregorian', { ascending });
    } else {
      query = query.order(sortBy as any, { ascending });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

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
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
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
