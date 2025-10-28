/**
 * API Route: POST /api/applicants/[id]/reject
 *
 * דחיית בקשה
 *
 * עקרונות SOLID:
 * - Single Responsibility: אחראי רק על דחיית בקשה
 * - Dependency Inversion: משתמש ב-Supabase דרך abstraction
 *
 * תהליך:
 * 1. בדיקת קיום הבקשה
 * 2. ולידציה שהבקשה במצב 'pending_approval'
 * 3. עדכון status ל-'rejected'
 * 4. שמירת rejected_at, rejected_by, rejection_reason
 * 5. המערכת תמחק אוטומטית אחרי 30 יום (cron job)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Schema לסיבת דחייה (אופציונלי)
const rejectBodySchema = z.object({
  reason: z.string().max(1000).optional(),
});

/**
 * POST /api/applicants/[id]/reject
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

    // 2. Parse body (אופציונלי - סיבת דחייה)
    let rejectionReason: string | undefined;
    try {
      const body = await request.json();
      const validated = rejectBodySchema.parse(body);
      rejectionReason = validated.reason;
    } catch {
      // אם אין body, זה בסדר - הסיבה אופציונלית
    }

    // 3. Fetch applicant
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

    // 4. Validate status
    if (applicant.status && applicant.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Applicant already processed', currentStatus: applicant.status },
        { status: 400 }
      );
    }

    // 5. Update applicant - reject
    // שימוש ב-JSONB update כדי לשמור מידע נוסף
    const updateData: any = {
      status: 'rejected',
      updated_at: new Date().toISOString(),
      form_data: {
        ...(applicant.form_data as any),
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        rejection_reason: rejectionReason || null,
      },
    };

    const { data: updatedApplicant, error: updateError } = await supabase
      .from('applicants')
      .update(updateData)
      .eq('id', applicantId)
      .select()
      .single();

    if (updateError || !updatedApplicant) {
      console.error('Error rejecting applicant:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject applicant', details: updateError?.message },
        { status: 500 }
      );
    }

    // 6. Success response
    return NextResponse.json({
      success: true,
      message: 'הבקשה נדחתה',
      data: {
        id: updatedApplicant.id,
        status: updatedApplicant.status,
        rejectedAt: updateData.form_data.rejected_at,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/applicants/[id]/reject:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
