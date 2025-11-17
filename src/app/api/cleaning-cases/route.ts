import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route: GET /api/cleaning-cases
 *
 * Fetch cleaning (sick children) cases with current month payment info
 *
 * Query params:
 * - status: 'active' | 'inactive' (default: 'active')
 * - search: string (optional) - search by family name or child name
 * - city: string (optional) - filter by city
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query params
    const status = searchParams.get('status') || 'active';
    const search = searchParams.get('search');
    const city = searchParams.get('city');

    // Build base query
    let query = supabase
      .from('cases')
      .select(
        `
        *,
        bank_details (*)
      `
      )
      .eq('case_type', 'cleaning')
      .eq('status', status)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `family_name.ilike.%${search}%,child_name.ilike.%${search}%`
      );
    }

    if (city) {
      query = query.eq('city', city);
    }

    // Execute query
    const { data: cases, error } = await query;

    if (error) {
      console.error('Error fetching cleaning cases:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cleaning cases' },
        { status: 500 }
      );
    }

    // Get current month payments for all cases
    if (cases && cases.length > 0) {
      const caseIds = cases.map((c) => c.id);
      const currentDate = new Date();
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .in('case_id', caseIds)
        .eq('payment_type', 'cleaning_monthly')
        .eq('payment_month', monthStr);

      // Map payments to cases
      const paymentsMap = new Map();
      payments?.forEach((payment) => {
        paymentsMap.set(payment.case_id, payment);
      });

      // Add current month payment to each case
      const casesWithPayments = cases.map((caseItem) => ({
        ...caseItem,
        current_month_payment: paymentsMap.get(caseItem.id) || null,
      }));

      return NextResponse.json(casesWithPayments);
    }

    return NextResponse.json(cases || []);
  } catch (error) {
    console.error('Unexpected error in GET /api/cleaning-cases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
