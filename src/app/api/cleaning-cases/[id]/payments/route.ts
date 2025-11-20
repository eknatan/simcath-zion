import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMonthlyCapFromSettings } from '@/lib/utils/payment-helpers';

/**
 * API Route: GET/POST /api/cleaning-cases/[id]/payments
 *
 * Manage monthly payments for cleaning cases
 *
 * עקרונות SOLID:
 * - Single Responsibility: מטפל רק בתשלומים של תיק
 * - Dependency Inversion: משתמש ב-Supabase דרך abstraction
 */

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/cleaning-cases/[id]/payments
 * Returns all payments for a case, sorted by month
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    // Build query
    let query = supabase
      .from('payments')
      .select('*')
      .eq('case_id', id)
      .eq('payment_type', 'cleaning_monthly')
      .order('payment_month', { ascending: false });

    // Filter by year if provided
    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('payment_month', startDate).lte('payment_month', endDate);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    // Get monthly cap for reference
    const monthlyCap = await getMonthlyCapFromSettings();

    // Calculate totals
    const totalAmount = payments?.reduce((sum, p) => sum + (p.amount_ils || 0), 0) || 0;
    const transferredAmount = payments
      ?.filter(p => p.status === 'transferred')
      .reduce((sum, p) => sum + (p.amount_ils || 0), 0) || 0;

    return NextResponse.json({
      payments: payments || [],
      summary: {
        totalAmount,
        transferredAmount,
        pendingAmount: totalAmount - transferredAmount,
        monthlyCap,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/cleaning-cases/[id]/payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cleaning-cases/[id]/payments
 * Create a new monthly payment
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payment_month, amount_ils, notes } = body;

    // Validation
    if (!payment_month) {
      return NextResponse.json(
        { error: 'payment_month is required' },
        { status: 400 }
      );
    }

    if (!amount_ils || amount_ils <= 0) {
      return NextResponse.json(
        { error: 'amount_ils must be greater than 0' },
        { status: 400 }
      );
    }

    // Format month to first day
    const monthDate = new Date(payment_month);
    const formattedMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;

    // Check for duplicate payment
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, amount_ils, status')
      .eq('case_id', id)
      .eq('payment_type', 'cleaning_monthly')
      .eq('payment_month', formattedMonth)
      .single();

    if (existingPayment) {
      return NextResponse.json(
        {
          error: 'Payment already exists for this month',
          existingPayment: {
            id: existingPayment.id,
            amount: existingPayment.amount_ils,
            status: existingPayment.status,
          },
        },
        { status: 409 }
      );
    }

    // Get monthly cap for validation warning
    const monthlyCap = await getMonthlyCapFromSettings();
    const exceedsCap = amount_ils > monthlyCap;

    // Create payment
    const { data: newPayment, error: createError } = await supabase
      .from('payments')
      .insert({
        case_id: id,
        payment_type: 'cleaning_monthly',
        payment_month: formattedMonth,
        amount_ils,
        status: 'pending',
        notes: notes || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError || !newPayment) {
      console.error('Error creating payment:', createError);
      return NextResponse.json(
        {
          error: createError?.message || 'Failed to create payment',
          details: createError?.details,
          hint: createError?.hint,
          code: createError?.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: newPayment,
      warnings: exceedsCap
        ? [`הסכום ${amount_ils} ₪ עולה על התקרה ${monthlyCap} ₪`]
        : [],
    });
  } catch (error) {
    console.error('Error in POST /api/cleaning-cases/[id]/payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cleaning-cases/[id]/payments
 * Update an existing pending payment (via query param ?paymentId=xxx)
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const body = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400 }
      );
    }

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check payment exists and is pending
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status, payment_month')
      .eq('id', paymentId)
      .eq('case_id', id)
      .single();

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (existingPayment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot edit payment that is not pending', status: existingPayment.status },
        { status: 400 }
      );
    }

    const { payment_month, amount_ils, notes } = body;

    // Build update object
    const updateData: {
      updated_at: string;
      payment_month?: string;
      amount_ils?: number;
      notes?: string | null;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (payment_month) {
      const monthDate = new Date(payment_month);
      updateData.payment_month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;

      // Check for duplicate if month changed
      if (updateData.payment_month !== existingPayment.payment_month) {
        const { data: duplicatePayment } = await supabase
          .from('payments')
          .select('id')
          .eq('case_id', id)
          .eq('payment_type', 'cleaning_monthly')
          .eq('payment_month', updateData.payment_month)
          .neq('id', paymentId)
          .single();

        if (duplicatePayment) {
          return NextResponse.json(
            { error: 'Payment already exists for this month' },
            { status: 409 }
          );
        }
      }
    }

    if (amount_ils !== undefined) {
      if (amount_ils <= 0) {
        return NextResponse.json(
          { error: 'amount_ils must be greater than 0' },
          { status: 400 }
        );
      }
      updateData.amount_ils = amount_ils;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Update payment
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError || !updatedPayment) {
      console.error('Error updating payment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      );
    }

    // Get monthly cap for warning
    const monthlyCap = await getMonthlyCapFromSettings();
    const exceedsCap = updatedPayment.amount_ils > monthlyCap;

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      warnings: exceedsCap
        ? [`הסכום ${updatedPayment.amount_ils} ₪ עולה על התקרה ${monthlyCap} ₪`]
        : [],
    });
  } catch (error) {
    console.error('Error in PUT /api/cleaning-cases/[id]/payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cleaning-cases/[id]/payments
 * Delete a pending payment (via query param ?paymentId=xxx)
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400 }
      );
    }

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check payment exists and is pending
    const { data: payment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('id', paymentId)
      .eq('case_id', id)
      .single();

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete payment that is not pending', status: payment.status },
        { status: 400 }
      );
    }

    // Delete payment
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (deleteError) {
      console.error('Error deleting payment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/cleaning-cases/[id]/payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
