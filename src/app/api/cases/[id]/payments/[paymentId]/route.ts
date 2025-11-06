import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/cases/[id]/payments/[paymentId]
 *
 * Delete an approved payment (only allowed for 'approved' status)
 *
 * @param request - Next.js request object
 * @param params - Route params containing case ID and payment ID
 * @returns Success or error response
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const supabase = await createClient();

    // ========================================
    // Authentication Check
    // ========================================
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: caseId, paymentId } = await params;

    // ========================================
    // Fetch Payment to Verify Status
    // ========================================
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('case_id', caseId)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json(
        { message: 'Payment not found', error: fetchError?.message },
        { status: 404 }
      );
    }

    // ========================================
    // Check if Payment Can Be Deleted
    // ========================================
    // Only allow deletion of 'approved' payments (not yet transferred)
    if (payment.status !== 'approved') {
      return NextResponse.json(
        {
          message: 'Cannot delete payment',
          reason: 'Only approved payments (not yet transferred) can be deleted',
          currentStatus: payment.status
        },
        { status: 400 }
      );
    }

    // ========================================
    // Delete Payment
    // ========================================
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)
      .eq('case_id', caseId);

    if (deleteError) {
      return NextResponse.json(
        { message: 'Failed to delete payment', error: deleteError.message },
        { status: 500 }
      );
    }

    // ========================================
    // Update Case Status if No More Approved Payments
    // ========================================
    // Check if there are any other approved payments for this case
    const { data: remainingPayments } = await supabase
      .from('payments')
      .select('id')
      .eq('case_id', caseId)
      .eq('status', 'approved');

    // If no more approved payments, revert case status to previous status
    if (!remainingPayments || remainingPayments.length === 0) {
      // Try to get the current case to retrieve previous_status
      try {
        const { data: currentCase } = await supabase
          .from('cases')
          .select('previous_status')
          .eq('id', caseId)
          .single();

        // Try to update with previous_status support
        await supabase
          .from('cases')
          .update({
            status: (currentCase as any)?.previous_status || 'new',
            previous_status: null // Clear previous_status after reverting
          })
          .eq('id', caseId);
      } catch (error) {
        // If previous_status column doesn't exist, just update the status
        await supabase
          .from('cases')
          .update({
            status: 'new'
          })
          .eq('id', caseId);
      }
    }

    // ========================================
    // Create Audit Log
    // ========================================
    await supabase.from('case_history').insert({
      case_id: caseId,
      user_id: user.id,
      action: 'payment_deleted',
      details: {
        payment_id: paymentId,
        amount_usd: payment.amount_usd,
        amount_ils: payment.amount_ils,
      },
    });

    return NextResponse.json(
      { message: 'Payment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/cases/[id]/payments/[paymentId]:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
