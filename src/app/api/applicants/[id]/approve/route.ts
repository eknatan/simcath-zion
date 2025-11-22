/**
 * API Route: POST /api/applicants/[id]/approve
 *
 * אישור בקשה ויצירת תיק חתונה
 *
 * עקרונות SOLID:
 * - Single Responsibility: אחראי רק על אישור בקשה
 * - Dependency Inversion: משתמש ב-Supabase דרך abstraction
 * - Open/Closed: ניתן להרחבה ללוגיקות נוספות
 *
 * תהליך:
 * 1. בדיקת קיום הבקשה
 * 2. ולידציה שהבקשה במצב 'pending_approval'
 * 3. יצירת מספר תיק רץ (7000+)
 * 4. העתקת נתונים מהטופס → טבלת cases
 * 5. עדכון status ב-applicants ל-'approved'
 * 6. רישום ב-case_history
 * 7. שליחת מייל למשפחה (אופציונלי)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Helper: Map form_data to case fields
 * ממיר את הנתונים מהטופס לשדות בטבלת cases
 */
function mapFormDataToCaseFields(formData: any, caseType: string) {
  const commonFields = {
    raw_form_json: formData,
    contact_phone: formData.groom_info?.phone || formData.personal_info?.phone,
    contact_email: formData.groom_info?.email || formData.personal_info?.email,
    address: formData.groom_info?.address || formData.personal_info?.address,
    city: formData.wedding_info?.city || formData.personal_info?.city,
  };

  if (caseType === 'wedding') {
    return {
      ...commonFields,
      // Wedding specific
      wedding_date_hebrew: formData.wedding_info?.date_hebrew,
      wedding_date_gregorian: formData.wedding_info?.date_gregorian,
      request_background: formData.wedding_info?.request_background,
      groom_first_name: formData.groom_info?.first_name,
      groom_last_name: formData.groom_info?.last_name,
      groom_id: formData.groom_info?.id,
      groom_father_name: formData.groom_info?.father_name,
      groom_mother_name: formData.groom_info?.mother_name,
      groom_father_occupation: formData.groom_info?.father_occupation,
      groom_mother_occupation: formData.groom_info?.mother_occupation,
      groom_school: formData.groom_info?.school,
      groom_memorial_day: formData.groom_info?.memorial_day,
      bride_first_name: formData.bride_info?.first_name,
      bride_last_name: formData.bride_info?.last_name,
      bride_id: formData.bride_info?.id,
      bride_father_name: formData.bride_info?.father_name,
      bride_mother_name: formData.bride_info?.mother_name,
      bride_father_occupation: formData.bride_info?.father_occupation,
      bride_mother_occupation: formData.bride_info?.mother_occupation,
      bride_school: formData.bride_info?.school,
      bride_memorial_day: formData.bride_info?.memorial_day,
      venue: formData.wedding_info?.venue,
      guests_count: formData.wedding_info?.guests_count,
      total_cost: formData.wedding_info?.total_cost,
      contact_phone2: formData.bride_info?.phone,
      contact_phone3: formData.additional_info?.emergency_contact_phone,
    };
  }

  // Cleaning case (future)
  return {
    ...commonFields,
    // TODO: Add cleaning-specific fields when implementing cleaning module
  };
}

/**
 * Helper: Get next case number
 * מחזיר את מספר התיק הבא (מתחיל מ-7000)
 */
async function getNextCaseNumber(
  supabase: any,
  caseType: string
): Promise<number> {
  const { data, error } = await supabase
    .from('cases')
    .select('case_number')
    .eq('case_type', caseType)
    .order('case_number', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    console.error('Error fetching latest case number:', error);
    throw new Error('Failed to get next case number');
  }

  // אם אין תיקים בכלל, מתחיל מ-7000
  if (!data) {
    return 7000;
  }

  // אחרת, הבא
  return data.case_number + 1;
}

/**
 * POST /api/applicants/[id]/approve
 */
export async function POST(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  const applicantId = params.id;

  try {
    // 1. Create Supabase client
    const supabase = await createClient();

    // 1.1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch applicant
    const { data: applicant, error: fetchError } = await supabase
      .from('applicants')
      .select('*')
      .eq('id', applicantId)
      .single();

    if (fetchError || !applicant) {
      return NextResponse.json(
        { error: 'Applicant not found' },
        { status: 404 }
      );
    }

    // 3. Validate status
    if (applicant.status && applicant.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Applicant already processed', currentStatus: applicant.status },
        { status: 400 }
      );
    }

    // 4. Get next case number
    const caseNumber = await getNextCaseNumber(supabase, applicant.case_type);

    // 5. Map form_data to case fields
    const caseFields = mapFormDataToCaseFields(
      applicant.form_data,
      applicant.case_type
    );

    // 6. Create new case
    const { data: newCase, error: createError } = await supabase
      .from('cases')
      .insert({
        case_number: caseNumber,
        case_type: applicant.case_type,
        applicant_id: applicantId,
        created_by: user.id,
        status: 'new',
        ...caseFields,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError || !newCase) {
      console.error('Error creating case:', createError);
      return NextResponse.json(
        { error: 'Failed to create case', details: createError?.message },
        { status: 500 }
      );
    }

    // 7. Update applicant status
    const { error: updateError } = await supabase
      .from('applicants')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicantId);

    if (updateError) {
      console.error('Error updating applicant:', updateError);
      // תיק כבר נוצר, אז זה לא critical error
      // אבל נרשום את זה
    }

    // 8. Log to case_history
    await supabase.from('case_history').insert({
      case_id: newCase.id,
      changed_by: user.id,
      field_changed: 'status',
      old_value: null,
      new_value: 'new',
      note: `case_created_from_applicant|applicantId:${applicantId.substring(0, 8)}`,
      changed_at: new Date().toISOString(),
    });

    // 9. Send email notification to applicant (case approved)
    try {
      const formData = applicant.form_data as any;
      const applicantEmail = formData.groom_info?.email || formData.personal_info?.email;
      const applicantName = applicant.case_type === 'wedding'
        ? `${formData.groom_info?.first_name || ''} ${formData.groom_info?.last_name || ''}`.trim()
        : formData.personal_info?.full_name || '';

      if (applicantEmail) {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': process.env.INTERNAL_EMAIL_API_KEY || '',
          },
          body: JSON.stringify({
            type: 'custom',
            to: [applicantEmail],
            subject: `בקשתכם אושרה - תיק W${caseNumber}`,
            text: `שלום ${applicantName},\n\nבשורות טובות! בקשתכם לתמיכה אושרה.\n\nמספר תיק: W${caseNumber}\n\nנציגנו יצור איתכם קשר בקרוב.\n\nבברכה,\nצוות התמיכה`,
            data: {
              caseNumber: `W${caseNumber}`,
              applicantName,
              caseType: applicant.case_type,
            },
            locale: 'he',
          }),
        });
      }
    } catch (emailError) {
      // שגיאת מייל לא תעצור את התהליך
      console.error('Error sending approval email:', emailError);
    }

    // 10. Success response
    return NextResponse.json(
      {
        success: true,
        message: `תיק W${caseNumber} נוצר בהצלחה`,
        case: {
          id: newCase.id,
          case_number: caseNumber,
          case_number_formatted: `W${caseNumber}`,
          status: newCase.status,
          case_type: newCase.case_type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/applicants/[id]/approve:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
