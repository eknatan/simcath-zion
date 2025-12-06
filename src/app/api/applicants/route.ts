import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { weddingFormSchema } from '@/lib/validations/wedding-form.schema';
import { z } from 'zod';
import { getPublicFormLimiter, checkRateLimit } from '@/lib/rate-limit';

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
  requestNumber: number;
  caseType: string;
  formData: any;
  locale: 'he' | 'en';
}): Promise<{ secretaryEmailSent: boolean; applicantEmailSent: boolean }> {
  const { requestNumber, caseType, formData, locale } = data;

  let secretaryEmailSent = false;
  let applicantEmailSent = false;

  try {
    // 1. Send email to secretary (case-created template)
    // The /api/email/send will automatically use secretary emails from DB
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://simcath-zion.vercel.app';

    // Get applicant details based on case type
    // Wedding uses nested structure (groom_info), cleaning uses flat structure
    const getApplicantDetails = () => {
      if (caseType === 'wedding') {
        return {
          name: `${formData.groom_info?.first_name || ''} ${formData.groom_info?.last_name || ''}`.trim() || 'לא צוין',
          email: formData.groom_info?.email,
          phone: formData.groom_info?.phone,
        };
      } else {
        // Cleaning case - flat structure
        return {
          name: `${formData.family_name || ''} - ${formData.child_name || ''}`.trim() || 'לא צוין',
          email: formData.email,
          phone: formData.phone1,
        };
      }
    };

    const applicantDetails = getApplicantDetails();

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
          caseNumber: requestNumber, // Use request_number from database
          caseType: caseType, // Send original value: 'wedding' or 'cleaning'
          applicantName: applicantDetails.name,
          applicantEmail: applicantDetails.email,
          applicantPhone: applicantDetails.phone,
          caseUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://simcath-zion.vercel.app'}/applicants/pending`,
          fullFormData: formData, // Send entire form data for detailed email
        },
        locale,
      }),
    });

    secretaryEmailSent = secretaryResponse.ok;

    // 2. Send confirmation email to applicant (applicant-notification template)
    // Use the already computed applicant details
    const applicantEmail = applicantDetails.email;
    const applicantName = caseType === 'wedding'
      ? `${formData.groom_info?.first_name || ''} ${formData.groom_info?.last_name || ''}`.trim() || 'שלום'
      : formData.family_name || 'שלום';

    if (applicantEmail) {
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
            referenceNumber: requestNumber, // Use request_number from database
          },
          locale,
        }),
      });

      applicantEmailSent = applicantResponse.ok;
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
    // Check if user is authenticated (skip rate limit for logged-in users)
    const supabaseAuth = await createClient();
    const { data: { session } } = await supabaseAuth.auth.getSession();
    const isAuthenticated = !!session;

    // Rate limiting only for public (non-authenticated) submissions
    if (!isAuthenticated) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ??
                 request.headers.get('x-real-ip') ??
                 'unknown';

      const limiter = getPublicFormLimiter();
      const { success: notRateLimited } = await checkRateLimit(limiter, ip);

      if (!notRateLimited) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Too many requests. Please try again later.',
            retryAfter: '1 hour',
          },
          {
            status: 429,
            headers: {
              'Retry-After': '3600',
              'X-RateLimit-Remaining': '0',
            }
          }
        );
      }
    }

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

    // Use admin client for public form submissions (bypasses RLS)
    // This is safe because the endpoint only allows creating new applicants/cases
    const supabase = supabaseAdmin;

    // For cleaning cases - create case directly without approval
    if (case_type === 'cleaning') {
      // Create case directly
      // Note: form_data has flat structure from sick children form
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          case_type: 'cleaning',
          status: 'active',
          family_name: form_data.family_name,
          child_name: form_data.child_name,
          parent1_name: form_data.parent1_name,
          parent1_id: form_data.parent1_id,
          parent2_name: form_data.parent2_name || null,
          parent2_id: form_data.parent2_id || null,
          address: form_data.address,
          city: form_data.city,
          contact_phone: form_data.phone1,
          contact_phone2: form_data.phone2 || null,
          contact_phone3: form_data.phone3 || null,
          contact_email: form_data.email,
          start_date: new Date().toISOString().split('T')[0], // Today's date
          raw_form_json: form_data,
        })
        .select('id, case_number')
        .single();

      if (caseError || !caseData) {
        console.error('Error creating case:', caseError);
        return NextResponse.json(
          { error: 'Failed to create case', details: caseError?.message },
          { status: 500 }
        );
      }

      // Save bank details to bank_details table
      const { error: bankError } = await supabase
        .from('bank_details')
        .insert({
          case_id: caseData.id,
          bank_number: form_data.bank_number,
          branch: form_data.branch,
          account_number: form_data.account_number,
          account_holder_name: form_data.account_holder_name,
        });

      if (bankError) {
        console.error('Error saving bank details:', bankError);
        // Don't fail the whole request, case is already created
      }

      // Send notification emails
      const locale = (form_data.locale || 'he') as 'he' | 'en';
      const emailResults = await sendApplicantEmails({
        applicantId: caseData.id,
        requestNumber: caseData.case_number,
        caseType: 'cleaning',
        formData: form_data,
        locale,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Case created successfully',
          data: {
            id: caseData.id,
            case_number: caseData.case_number,
            auto_approved: true,
          },
          emails: {
            secretaryNotified: emailResults.secretaryEmailSent,
            applicantNotified: emailResults.applicantEmailSent,
          },
        },
        { status: 201 }
      );
    }

    // For wedding cases - keep existing flow
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
      requestNumber: data.request_number,
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
          reference: data.request_number, // Use request_number from database
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
