import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PaymentApprovalData } from '@/types/case.types';

/**
 * POST /api/cases/[id]/payments/approve
 *
 * Approve a payment for wedding case
 *
 * Steps:
 * 1. Validate user is authenticated
 * 2. Validate case exists and is wedding type
 * 3. Validate bank details exist
 * 4. Create payment record
 * 5. Update case status to 'pending_transfer'
 * 6. Log in case history
 *
 * @param request - Next.js request object with PaymentApprovalData
 * @param params - Route params containing case ID
 * @returns Created payment record
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: caseId } = await params;

    // ========================================
    // Parse Request Body
    // ========================================
    const body: PaymentApprovalData = await request.json();
    const { amount_usd, amount_ils, exchange_rate, notes } = body;

    // Validate required fields
    if (!amount_ils || amount_ils <= 0) {
      return NextResponse.json(
        { message: 'Amount in ILS is required and must be greater than 0' },
        { status: 400 }
      );
    }

    // ========================================
    // Fetch Case
    // ========================================
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        { message: 'Case not found', error: caseError?.message },
        { status: 404 }
      );
    }

    // Validate case type
    if (caseData.case_type !== 'wedding') {
      return NextResponse.json(
        { message: 'Payment approval is only for wedding cases' },
        { status: 400 }
      );
    }

    // ========================================
    // Fetch Bank Details
    // ========================================
    const { data: bankDetails, error: bankError } = await supabase
      .from('bank_details')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (bankError || !bankDetails) {
      return NextResponse.json(
        { message: 'Bank details not found. Please fill bank details first.' },
        { status: 400 }
      );
    }

    // ========================================
    // Create Payment Record
    // ========================================
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        case_id: caseId,
        payment_type: 'wedding_transfer',
        amount_usd,
        amount_ils,
        exchange_rate,
        status: 'approved',
        approved_by: user.id,
        notes,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Failed to create payment:', paymentError);
      return NextResponse.json(
        { message: 'Failed to create payment', error: paymentError?.message },
        { status: 500 }
      );
    }

    // ========================================
    // Update Case Status
    // ========================================
    const { error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'pending_transfer',
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId);

    if (updateError) {
      console.error('Failed to update case status:', updateError);
      // Note: We don't rollback the payment here
      // The payment was created successfully
    }

    // ========================================
    // Log in Case History
    // ========================================
    const { error: historyError } = await supabase.from('case_history').insert({
      case_id: caseId,
      changed_by: user.id,
      field_changed: 'payment_approved',
      old_value: null,
      new_value: `Approved payment: ₪${amount_ils}${
        amount_usd ? ` ($${amount_usd})` : ''
      }`,
      note: `Payment approved and case status changed to pending_transfer`,
    });

    if (historyError) {
      console.error('Failed to log case history:', historyError);
      // Non-critical error, continue
    }

    // ========================================
    // Return Success
    // ========================================
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/cases/[id]/payments/approve:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
