import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current year for yearly stats
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString();

    // Parallel queries for better performance
    const [
      totalCasesResult,
      weddingCasesResult,
      cleaningCasesResult,
      pendingTransfersResult,
      transferredThisYearResult,
      lastMonthCasesResult,
      pendingApplicantsResult,
    ] = await Promise.all([
      // Total cases
      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true }),

      // Wedding cases by status
      supabase
        .from('cases')
        .select('status', { count: 'exact' })
        .eq('case_type', 'wedding'),

      // Cleaning cases (active)
      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('case_type', 'cleaning')
        .eq('status', 'active'),

      // Pending transfers count (approved but not yet transferred)
      supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .is('transferred_at', null),

      // Total transferred amount this year
      supabase
        .from('payments')
        .select('approved_amount')
        .eq('status', 'transferred')
        .gte('transferred_at', startOfYear),

      // Cases created last month (for trend)
      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()),

      // Pending applicants count
      supabase
        .from('applicants')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_approval'),
    ]);

    // Calculate total transferred amount
    const totalTransferred = transferredThisYearResult.data?.reduce(
      (sum, payment) => sum + (payment.approved_amount || 0),
      0
    ) || 0;

    // Calculate active cases (wedding not completed/rejected + cleaning active)
    // Wedding is active if status is NOT: transferred, rejected, or expired
    const activeWeddings = weddingCasesResult.data?.filter(c =>
      !['transferred', 'rejected', 'expired'].includes(c.status)
    ).length || 0;
    const activeCases = (cleaningCasesResult.count || 0) + activeWeddings;

    // Calculate trend (simplified - just show last month count)
    const lastMonthCount = lastMonthCasesResult.count || 0;

    return NextResponse.json({
      totalCases: totalCasesResult.count || 0,
      activeCases,
      pendingTransfers: pendingTransfersResult.count || 0,
      pendingApplicants: pendingApplicantsResult.count || 0,
      totalTransferred,
      lastMonthCases: lastMonthCount,
      weddingCases: weddingCasesResult.data?.length || 0,
      cleaningCases: cleaningCasesResult.count || 0,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
