import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route: POST /api/cleaning-cases/[id]/close
 *
 * Close a cleaning case with reason
 *
 * עקרונות SOLID:
 * - Single Responsibility: מטפל רק בסגירת תיק
 */

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface CloseRequest {
  reason: 'healed' | 'deceased' | 'other';
  notes?: string;
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CloseRequest = await request.json();
    const { reason, notes } = body;

    // Validation
    if (!reason || !['healed', 'deceased', 'other'].includes(reason)) {
      return NextResponse.json(
        { error: 'Valid reason is required (healed, deceased, other)' },
        { status: 400 }
      );
    }

    // Get current case to verify it exists and is active
    const { data: caseData, error: fetchError } = await supabase
      .from('cases')
      .select('id, status, case_type')
      .eq('id', id)
      .single();

    if (fetchError || !caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    if (caseData.case_type !== 'cleaning') {
      return NextResponse.json(
        { error: 'This endpoint is only for cleaning cases' },
        { status: 400 }
      );
    }

    if (caseData.status === 'inactive') {
      return NextResponse.json(
        { error: 'Case is already closed' },
        { status: 400 }
      );
    }

    // Check for pending payments (warning only, not blocking)
    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('id, payment_month, amount_ils')
      .eq('case_id', id)
      .eq('status', 'pending');

    // Update case status
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'inactive',
        end_date: new Date().toISOString().split('T')[0], // DATE format, not timestamp
        end_reason: reason,
        end_reason_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedCase) {
      console.error('Error closing case:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to close case',
          details: updateError?.message || 'Unknown error',
          code: updateError?.code
        },
        { status: 500 }
      );
    }

    // Log to case history
    const noteKey = notes
      ? `case_closed_with_notes|reason:${reason}|notes:${notes}`
      : `case_closed|reason:${reason}`;
    await supabase.from('case_history').insert({
      case_id: id,
      changed_by: user.id,
      field_changed: 'status',
      old_value: 'active',
      new_value: 'inactive',
      note: noteKey,
      changed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      case: updatedCase,
      warnings: pendingPayments && pendingPayments.length > 0
        ? [{
            message: `יש ${pendingPayments.length} תשלומים ממתינים שיישארו בטבלת העברות`,
            payments: pendingPayments,
          }]
        : [],
    });
  } catch (error) {
    console.error('Error in POST /api/cleaning-cases/[id]/close:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
