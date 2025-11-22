import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMonthlyCapFromSettings } from '@/lib/utils/payment-helpers';

/**
 * API Route: POST /api/cleaning-cases/bulk-payments
 *
 * Create multiple monthly payments at once (bulk entry)
 *
 * עקרונות SOLID:
 * - Single Responsibility: מטפל רק בהזנה מרובה של תשלומים
 * - Dependency Inversion: משתמש ב-Supabase דרך abstraction
 */

interface BulkPaymentInput {
  case_id: string;
  amount_ils: number;
  notes?: string;
}

interface BulkPaymentRequest {
  payment_month: string;
  payments: BulkPaymentInput[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BulkPaymentRequest = await request.json();
    const { payment_month, payments } = body;

    // Validation
    if (!payment_month) {
      return NextResponse.json(
        { error: 'payment_month is required' },
        { status: 400 }
      );
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json(
        { error: 'payments array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Format month to first day
    const monthDate = new Date(payment_month);
    const formattedMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;

    // Get monthly cap for warnings
    const monthlyCap = await getMonthlyCapFromSettings();

    // Get existing payments for this month to check for duplicates
    const caseIds = payments.map(p => p.case_id);
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('case_id')
      .in('case_id', caseIds)
      .eq('payment_type', 'monthly_cleaning')
      .eq('payment_month', formattedMonth);

    const existingCaseIds = new Set(existingPayments?.map(p => p.case_id) || []);

    // Get case statuses to filter out inactive cases
    const { data: casesData } = await supabase
      .from('cases')
      .select('id, status')
      .in('id', caseIds);

    const inactiveCaseIds = new Set(
      casesData?.filter(c => c.status !== 'active').map(c => c.id) || []
    );

    // Prepare results
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
      warnings: [] as string[],
      totalAmount: 0,
    };

    // Filter out invalid payments
    const validPayments = payments.filter(p => {
      // Skip inactive cases
      if (inactiveCaseIds.has(p.case_id)) {
        results.errors.push(`Case ${p.case_id} is inactive`);
        return false;
      }
      // Skip duplicates
      if (existingCaseIds.has(p.case_id)) {
        results.skipped++;
        return false;
      }
      // Validate amount
      if (!p.amount_ils || p.amount_ils <= 0) {
        results.errors.push(`Invalid amount for case ${p.case_id}`);
        return false;
      }
      return true;
    });

    if (validPayments.length === 0) {
      return NextResponse.json({
        success: true,
        ...results,
        message: 'No valid payments to create',
      });
    }

    // Prepare payment records with 'approved' status for transfer integration
    const paymentRecords = validPayments.map(p => ({
      case_id: p.case_id,
      payment_type: 'monthly_cleaning',
      payment_month: formattedMonth,
      amount_ils: p.amount_ils,
      status: 'approved', // Phase 9: Set to 'approved' for immediate transfer integration
      notes: p.notes || null,
      created_at: new Date().toISOString(),
    }));

    // Insert all payments
    const { data: createdPayments, error: insertError } = await supabase
      .from('payments')
      .insert(paymentRecords)
      .select();

    if (insertError) {
      console.error('Error creating bulk payments:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to create payments',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Calculate results
    results.created = createdPayments?.length || 0;
    results.totalAmount = createdPayments?.reduce((sum, p) => sum + (p.amount_ils || 0), 0) || 0;

    // Check for over-cap warnings
    const overCapPayments = createdPayments?.filter(p => p.amount_ils > monthlyCap) || [];
    if (overCapPayments.length > 0) {
      results.warnings.push(
        `${overCapPayments.length} תשלומים עולים על התקרה של ${monthlyCap} ₪`
      );
    }

    return NextResponse.json({
      success: true,
      ...results,
      payments: createdPayments,
    });
  } catch (error) {
    console.error('Error in POST /api/cleaning-cases/bulk-payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cleaning-cases/bulk-payments
 * Get families eligible for bulk payment entry (active cases without payment for selected month)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get month from query params, default to current month
    const monthParam = searchParams.get('month');
    let formattedMonth: string;

    if (monthParam) {
      const monthDate = new Date(monthParam);
      formattedMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;
    } else {
      const now = new Date();
      formattedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    // Get all active cleaning cases
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select(`
        id,
        case_number,
        family_name,
        child_name,
        contact_phone,
        city,
        bank_details (*)
      `)
      .eq('case_type', 'cleaning')
      .eq('status', 'active')
      .order('family_name', { ascending: true });

    if (casesError) {
      console.error('Error fetching cases:', casesError);
      return NextResponse.json(
        { error: 'Failed to fetch cases' },
        { status: 500 }
      );
    }

    if (!cases || cases.length === 0) {
      return NextResponse.json({
        families: [],
        month: formattedMonth,
        monthlyCap: await getMonthlyCapFromSettings(),
      });
    }

    // Get existing payments for this month
    const caseIds = cases.map(c => c.id);
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('case_id, amount_ils, status')
      .in('case_id', caseIds)
      .eq('payment_type', 'monthly_cleaning')
      .eq('payment_month', formattedMonth);

    const paymentsMap = new Map();
    existingPayments?.forEach(p => {
      paymentsMap.set(p.case_id, p);
    });

    // Map cases with payment status
    const families = cases.map(caseItem => ({
      ...caseItem,
      has_payment: paymentsMap.has(caseItem.id),
      existing_payment: paymentsMap.get(caseItem.id) || null,
    }));

    // Get monthly cap
    const monthlyCap = await getMonthlyCapFromSettings();

    return NextResponse.json({
      families,
      month: formattedMonth,
      monthlyCap,
    });
  } catch (error) {
    console.error('Error in GET /api/cleaning-cases/bulk-payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
