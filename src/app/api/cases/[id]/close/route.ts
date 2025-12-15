/**
 * API Route: POST /api/cases/[id]/close
 *
 * סגירת תיק חתונה (לאחר שהיה תשלום)
 *
 * תהליך:
 * 1. בדיקת קיום התיק
 * 2. ולידציה שהתיק במצב 'pending_transfer' או 'active'
 * 3. עדכון סטטוס התיק ל-'transferred'
 * 4. עדכון תשלומים מאושרים ל-'transferred'
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
 * POST /api/cases/[id]/close
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

    // 3. Validate status - must be 'pending_transfer' or 'active'
    const validStatuses = ['pending_transfer', 'active'];
    if (!validStatuses.includes(caseData.status)) {
      return NextResponse.json(
        {
          error: 'Only cases with pending_transfer or active status can be closed',
          currentStatus: caseData.status
        },
        { status: 400 }
      );
    }

    const previousStatus = caseData.status;

    // 4. Update case status to 'transferred'
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'transferred',
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)
      .select()
      .single();

    if (updateError || !updatedCase) {
      console.error('Error closing case:', updateError);
      return NextResponse.json(
        { error: 'Failed to close case', details: updateError?.message },
        { status: 500 }
      );
    }

    // 5. Update approved payments to 'transferred'
    const { error: paymentsError } = await supabase
      .from('payments')
      .update({
        status: 'transferred',
        transferred_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('case_id', caseId)
      .eq('status', 'approved');

    if (paymentsError) {
      console.error('Error updating payments:', paymentsError);
      // Don't fail the whole operation, case was already closed
    }

    // 6. Log to case_history
    const auditLogger = createAuditLogger(supabase);
    await auditLogger.logAction(caseId, user.id, 'status', {
      oldValue: previousStatus,
      newValue: 'transferred',
      note: 'התיק נסגר',
    });

    // 7. Success response
    return NextResponse.json({
      success: true,
      message: 'התיק נסגר בהצלחה',
      data: {
        id: updatedCase.id,
        status: updatedCase.status,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/cases/[id]/close:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
