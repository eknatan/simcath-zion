import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/cases/[id]/payments
 *
 * Fetch all payments for a specific case
 *
 * @param request - Next.js request object
 * @param params - Route params containing case ID
 * @returns List of payments with user info
 */
export async function GET(
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
    // Fetch Payments
    // ========================================
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(
        `
        *,
        approved_by_profile:profiles!payments_approved_by_fkey (
          name
        )
      `
      )
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Failed to fetch payments:', paymentsError);
      return NextResponse.json(
        { message: 'Failed to fetch payments', error: paymentsError.message },
        { status: 500 }
      );
    }

    // Transform data to include user names
    const paymentsWithUser = (payments || []).map((payment) => ({
      ...payment,
      approved_by_name:
        (payment.approved_by_profile as any)?.name || 'Unknown',
    }));

    return NextResponse.json(paymentsWithUser);
  } catch (error) {
    console.error('Error in GET /api/cases/[id]/payments:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
