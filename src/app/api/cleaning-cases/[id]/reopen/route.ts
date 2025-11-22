import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route: POST /api/cleaning-cases/[id]/reopen
 *
 * Reopen a closed cleaning case
 *
 * עקרונות SOLID:
 * - Single Responsibility: מטפל רק בפתיחה מחדש של תיק
 */

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
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

    // Get current case to verify it exists and is inactive
    const { data: caseData, error: fetchError } = await supabase
      .from('cases')
      .select('id, status, case_type, end_reason')
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

    if (caseData.status === 'active') {
      return NextResponse.json(
        { error: 'Case is already active' },
        { status: 400 }
      );
    }

    // Update case status
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'active',
        end_date: null,
        end_reason: null,
        end_reason_notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedCase) {
      console.error('Error reopening case:', updateError);
      return NextResponse.json(
        { error: 'Failed to reopen case' },
        { status: 500 }
      );
    }

    // Log to case history
    await supabase.from('case_history').insert({
      case_id: id,
      changed_by: user.id,
      field_changed: 'status',
      old_value: 'inactive',
      new_value: 'active',
      note: `case_reopened|previousReason:${caseData.end_reason || 'other'}`,
      changed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      case: updatedCase,
    });
  } catch (error) {
    console.error('Error in POST /api/cleaning-cases/[id]/reopen:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
