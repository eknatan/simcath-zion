/**
 * API Route: POST /api/applicants/[id]/restore
 *
 * שחזור בקשה נדחית
 *
 * עקרונות SOLID:
 * - Single Responsibility: אחראי רק על שחזור בקשות נדחות
 * - Dependency Inversion: משתמש ב-Supabase דרך abstraction
 *
 * תהליך:
 * 1. בדיקת קיום הבקשה
 * 2. ולידציה שהבקשה במצב 'rejected'
 * 3. בדיקה שלא עברו 30 יום מהדחייה
 * 4. שחזור ל-status: 'pending_approval'
 * 5. מחיקת נתוני הדחייה
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Helper: Calculate days since rejection
 */
function getDaysSinceRejection(rejectedAt: string): number {
  const now = new Date();
  const rejectionDate = new Date(rejectedAt);
  const diffTime = Math.abs(now.getTime() - rejectionDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * POST /api/applicants/[id]/restore
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
    if (applicant.status !== 'rejected') {
      return NextResponse.json(
        { error: 'Only rejected applicants can be restored', currentStatus: applicant.status },
        { status: 400 }
      );
    }

    // 4. Check rejection date (from form_data.rejected_at)
    const formData = applicant.form_data as any;
    const rejectedAt = formData?.rejected_at;

    if (!rejectedAt) {
      // אין תאריך דחייה, אבל הסטטוס rejected - נאפשר שחזור
      console.warn('Rejected applicant without rejected_at date:', applicantId);
    } else {
      const daysSince = getDaysSinceRejection(rejectedAt);
      if (daysSince > 30) {
        return NextResponse.json(
          {
            error: 'Cannot restore after 30 days',
            daysSinceRejection: daysSince,
          },
          { status: 400 }
        );
      }
    }

    // 5. Restore applicant
    // נסיר את נתוני הדחייה מה-form_data
    const cleanedFormData = { ...formData };
    delete cleanedFormData.rejected_at;
    delete cleanedFormData.rejected_by;
    delete cleanedFormData.rejection_reason;

    const { data: restoredApplicant, error: updateError } = await supabase
      .from('applicants')
      .update({
        status: 'pending_approval',
        form_data: cleanedFormData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicantId)
      .select()
      .single();

    if (updateError || !restoredApplicant) {
      console.error('Error restoring applicant:', updateError);
      return NextResponse.json(
        { error: 'Failed to restore applicant', details: updateError?.message },
        { status: 500 }
      );
    }

    // 6. Success response
    return NextResponse.json({
      success: true,
      message: 'הבקשה שוחזרה בהצלחה',
      data: {
        id: restoredApplicant.id,
        status: restoredApplicant.status,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/applicants/[id]/restore:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
