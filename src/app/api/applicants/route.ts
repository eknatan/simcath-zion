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
 * - Single Responsibility: מטפל רק בקבלת וש מירת בקשות
 * - Dependency Inversion: משתמש ב-Supabase דרך abstraction
 * - Interface Segregation: מקבל רק את הנתונים הנדרשים
 *
 * תהליך:
 * 1. Validation של הנתונים עם Zod
 * 2. שמירה ב-DB (טבלת applicants)
 * 3. שליחת מייל למזכירות (TODO)
 * 4. החזרת תגובה למשתמש
 */

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
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        {
          error: 'Failed to save application',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // TODO: Send email to secretary
    // await sendEmailToSecretary(data);

    // Success response
    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully',
        data: {
          id: data.id,
          reference: data.id.substring(0, 8).toUpperCase(),
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
