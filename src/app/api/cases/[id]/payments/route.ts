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
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Failed to fetch payments:', paymentsError);
      return NextResponse.json(
        { message: 'Failed to fetch payments', error: paymentsError.message },
        { status: 500 }
      );
    }

    // ========================================
    // Batch Fetch Profile Names (Optimized - Single Query)
    // ========================================
    // Get unique approver IDs to avoid N+1 queries
    const approverIds = [
      ...new Set(
        payments
          ?.filter((p): p is typeof p & { approved_by: string } => !!p.approved_by)
          .map((p) => p.approved_by) || []
      ),
    ];

    // Single query for all profiles instead of one per payment
    const { data: profiles } =
      approverIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, name')
            .in('id', approverIds)
        : { data: [] };

    // Create lookup map for O(1) access
    const profileMap = new Map(profiles?.map((p) => [p.id, p.name]) || []);

    // Map payments with names using the lookup
    const paymentsWithUser =
      payments?.map((payment) => ({
        ...payment,
        approved_by_name: payment.approved_by
          ? profileMap.get(payment.approved_by) || 'Unknown'
          : 'Unknown',
      })) || [];

    return NextResponse.json(paymentsWithUser);
  } catch (error) {
    console.error('Error in GET /api/cases/[id]/payments:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
