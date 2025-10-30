import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CaseUpdatePayload } from '@/types/case.types';

/**
 * GET /api/cases/[id]
 * Fetch a single case with all relations
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Fetch case with all relations
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(
        `
        *,
        bank_details(*),
        files(*),
        payments(*),
        translations(*)
      `
      )
      .eq('id', id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        { error: 'Case not found', message: caseError?.message },
        { status: 404 }
      );
    }

    // Fetch history separately
    const { data: historyData } = await supabase
      .from('case_history')
      .select(
        `
        *,
        profiles:changed_by(name)
      `
      )
      .eq('case_id', id)
      .order('changed_at', { ascending: false })
      .limit(50);

    // Combine data
    const caseWithRelations = {
      ...caseData,
      history: historyData || [],
    };

    return NextResponse.json(caseWithRelations);
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/[id]
 * Update a case
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const updates: CaseUpdatePayload = await request.json();

    // Validate: cannot update certain fields
    const protectedFields = ['id', 'created_at', 'case_number'];
    const hasProtectedFields = protectedFields.some((field) =>
      Object.keys(updates).includes(field)
    );

    if (hasProtectedFields) {
      return NextResponse.json(
        { error: 'Cannot update protected fields' },
        { status: 400 }
      );
    }

    // Update the case
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedCase) {
      return NextResponse.json(
        { error: 'Failed to update case', message: updateError?.message },
        { status: 400 }
      );
    }

    // Log the change in case_history
    // Note: Only log if there are actual changes
    const changedFields = Object.keys(updates);

    if (changedFields.length > 0) {
      // Create history entries for changed fields
      const historyPromises = changedFields.map((field) => {
        return supabase.from('case_history').insert({
          case_id: id,
          changed_by: user.id,
          field_changed: field,
          new_value: String(updates[field as keyof typeof updates]),
          note: `Updated ${field}`,
        });
      });

      await Promise.all(historyPromises);
    }

    // Fetch updated case with relations
    const { data: caseWithRelations } = await supabase
      .from('cases')
      .select(
        `
        *,
        bank_details(*),
        files(*),
        payments(*),
        translations(*)
      `
      )
      .eq('id', id)
      .single();

    return NextResponse.json(caseWithRelations || updatedCase);
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cases/[id]
 * Delete a case (soft delete - set status to deleted)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete - set status to 'deleted'
    const { data: deletedCase, error: deleteError } = await supabase
      .from('cases')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (deleteError || !deletedCase) {
      return NextResponse.json(
        { error: 'Failed to delete case', message: deleteError?.message },
        { status: 400 }
      );
    }

    // Log the deletion
    await supabase.from('case_history').insert({
      case_id: id,
      changed_by: user.id,
      field_changed: 'status',
      new_value: 'deleted',
      note: 'Case deleted',
    });

    return NextResponse.json({ success: true, case: deletedCase });
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}
