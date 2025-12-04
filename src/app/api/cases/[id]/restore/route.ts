/**
 * API Route: POST /api/cases/[id]/restore
 *
 * שחזור תיק חתונה נדחה
 *
 * תהליך:
 * 1. בדיקת קיום התיק
 * 2. ולידציה שהתיק במצב 'rejected'
 * 3. בדיקה שלא עברו 30 יום מהדחייה
 * 4. שחזור לסטטוס הקודם (previous_status)
 * 5. מחיקת נתוני הדחייה
 * 6. רישום ב-case_history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAuditLogger } from '@/lib/middleware/audit-log.middleware';

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
 * POST /api/cases/[id]/restore
 */
export async function POST(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  const caseId = params.id;

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

    // 2. Fetch case
    const { data: caseData, error: fetchError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (fetchError || !caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // 3. Validate status
    if (caseData.status !== 'rejected') {
      return NextResponse.json(
        { error: 'Only rejected cases can be restored', currentStatus: caseData.status },
        { status: 400 }
      );
    }

    // 4. Check rejection date
    const rejectedAt = caseData.rejected_at;

    if (!rejectedAt) {
      // אין תאריך דחייה, אבל הסטטוס rejected - נאפשר שחזור
      console.warn('Rejected case without rejected_at date:', caseId);
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

    // 5. Determine status to restore to
    // Use previous_status if available, otherwise default to 'new'
    const restoreToStatus = caseData.previous_status || 'new';

    // 6. Restore case
    const { data: restoredCase, error: updateError } = await supabase
      .from('cases')
      .update({
        status: restoreToStatus,
        rejected_at: null,
        rejected_by: null,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)
      .select()
      .single();

    if (updateError || !restoredCase) {
      console.error('Error restoring case:', updateError);
      return NextResponse.json(
        { error: 'Failed to restore case', details: updateError?.message },
        { status: 500 }
      );
    }

    // 7. Log to case_history
    const auditLogger = createAuditLogger(supabase);
    await auditLogger.logAction(caseId, user.id, 'status', {
      oldValue: 'rejected',
      newValue: restoreToStatus,
      note: 'שוחזר תיק נדחה',
    });

    // 8. Success response
    return NextResponse.json({
      success: true,
      message: 'התיק שוחזר בהצלחה',
      data: {
        id: restoredCase.id,
        status: restoredCase.status,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/cases/[id]/restore:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
