/**
 * API Route: POST /api/cases/[id]/restore
 *
 * שחזור תיק חתונה נדחה או שהועבר
 *
 * תהליך לתיקים נדחים (rejected):
 * 1. בדיקת קיום התיק
 * 2. ולידציה שהתיק במצב 'rejected'
 * 3. בדיקה שלא עברו 30 יום מהדחייה
 * 4. שחזור לסטטוס הקודם (previous_status)
 * 5. מחיקת נתוני הדחייה
 * 6. רישום ב-case_history
 *
 * תהליך לתיקים שהועברו (transferred):
 * 1. בדיקת קיום התיק
 * 2. ולידציה שהתיק במצב 'transferred'
 * 3. שחזור לסטטוס 'pending_transfer'
 * 4. עדכון התשלומים חזרה ל-'approved'
 * 5. רישום ב-case_history
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

    // 3. Validate status - must be either 'rejected' or 'transferred'
    const isRejected = caseData.status === 'rejected';
    const isTransferred = caseData.status === 'transferred';

    if (!isRejected && !isTransferred) {
      return NextResponse.json(
        { error: 'Only rejected or transferred cases can be restored', currentStatus: caseData.status },
        { status: 400 }
      );
    }

    // 4. For rejected cases: Check rejection date (30 day limit)
    if (isRejected) {
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
    }

    // 5. Determine status to restore to
    let restoreToStatus: string;
    if (isRejected) {
      // For rejected: use previous_status if available, otherwise default to 'new'
      restoreToStatus = caseData.previous_status || 'new';
    } else {
      // For transferred: restore to 'active' (not 'pending_transfer')
      // because the transfer already happened, no new payment is pending yet
      restoreToStatus = 'active';
    }

    // 6. Restore case
    const updateData: Record<string, unknown> = {
      status: restoreToStatus,
      updated_at: new Date().toISOString(),
    };

    // Clear rejection fields if restoring from rejected
    if (isRejected) {
      updateData.rejected_at = null;
      updateData.rejected_by = null;
      updateData.rejection_reason = null;
    }

    const { data: restoredCase, error: updateError } = await supabase
      .from('cases')
      .update(updateData)
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

    // 7. For transferred cases: payments stay as 'transferred' (they were completed)
    // We only restore the case to 'active' status, not the payments

    // 8. Log to case_history
    const auditLogger = createAuditLogger(supabase);
    const note = isRejected ? 'שוחזר תיק נדחה' : 'שוחזר תיק מההיסטוריה לפעיל';
    await auditLogger.logAction(caseId, user.id, 'status', {
      oldValue: caseData.status,
      newValue: restoreToStatus,
      note,
    });

    // 9. Success response
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
