/**
 * API Route: POST /api/cases/[id]/reject
 *
 * דחיית תיק חתונה
 *
 * תהליך:
 * 1. בדיקת קיום התיק
 * 2. שמירת הסטטוס הנוכחי לפני הדחייה
 * 3. עדכון status ל-'rejected'
 * 4. שמירת rejected_at, rejected_by, rejection_reason
 * 5. רישום ב-case_history
 * 6. ניתן לשחזר תוך 30 יום
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAuditLogger } from '@/lib/middleware/audit-log.middleware';
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
 * POST /api/cases/[id]/reject
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

    // 2. Parse body (אופציונלי - סיבת דחייה)
    let rejectionReason: string | undefined;
    try {
      const body = await request.json();
      const validated = rejectBodySchema.parse(body);
      rejectionReason = validated.reason;
    } catch {
      // אם אין body, זה בסדר - הסיבה אופציונלית
    }

    // 3. Fetch case
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

    // 4. Check if already rejected
    if (caseData.status === 'rejected') {
      return NextResponse.json(
        { error: 'Case is already rejected' },
        { status: 400 }
      );
    }

    // 5. Save current status before rejection (for restore)
    const previousStatus = caseData.status;

    // 6. Update case - reject
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'rejected',
        previous_status: previousStatus,
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        rejection_reason: rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)
      .select()
      .single();

    if (updateError || !updatedCase) {
      console.error('Error rejecting case:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject case', details: updateError?.message },
        { status: 500 }
      );
    }

    // 7. Log to case_history
    const auditLogger = createAuditLogger(supabase);
    await auditLogger.logAction(caseId, user.id, 'status', {
      oldValue: previousStatus,
      newValue: 'rejected',
      note: rejectionReason ? `דחה תיק: ${rejectionReason}` : 'דחה תיק',
    });

    // 8. Success response
    return NextResponse.json({
      success: true,
      message: 'התיק נדחה',
      data: {
        id: updatedCase.id,
        status: updatedCase.status,
        previousStatus,
        rejectedAt: updatedCase.rejected_at,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/cases/[id]/reject:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
