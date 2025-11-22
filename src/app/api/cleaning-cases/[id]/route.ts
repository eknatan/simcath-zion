import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route: GET/PUT /api/cleaning-cases/[id]
 *
 * Get or update a specific cleaning case with summary data
 *
 * עקרונות SOLID:
 * - Single Responsibility: מטפל רק בתיק ספציפי
 * - Dependency Inversion: משתמש ב-Supabase דרך abstraction
 */

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/cleaning-cases/[id]
 * Returns case details with computed summary
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Fetch case with relations
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        bank_details(*),
        payments(*)
      `)
      .eq('id', id)
      .eq('case_type', 'cleaning')
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Calculate summary
    const payments = caseData.payments || [];
    const transferredPayments = payments.filter(
      (p: any) => p.status === 'transferred'
    );

    const summary = {
      totalPaid: transferredPayments.reduce(
        (sum: number, p: any) => sum + (p.amount_ils || 0),
        0
      ),
      activeMonths: transferredPayments.length,
      pendingPayments: payments.filter((p: any) => p.status === 'pending').length,
      lastPaymentDate: transferredPayments.length > 0
        ? transferredPayments.sort(
            (a: any, b: any) =>
              new Date(b.payment_month).getTime() - new Date(a.payment_month).getTime()
          )[0].payment_month
        : null,
    };

    // Get last email sent
    const { data: lastEmail } = await supabase
      .from('email_logs')
      .select('sent_at')
      .eq('case_id', id)
      .eq('email_type', 'monthly_request')
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      ...caseData,
      summary: {
        ...summary,
        lastEmailSent: lastEmail?.sent_at || null,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/cleaning-cases/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cleaning-cases/[id]
 * Update case details (contact info, bank details)
 */
export async function PUT(request: NextRequest, context: RouteParams) {
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

    // Extract updatable fields
    const {
      address,
      city,
      contact_phone,
      contact_phone2,
      contact_phone3,
      contact_email,
      bank_details,
    } = body;

    // Update case fields
    const caseUpdateData: Record<string, any> = {};
    if (address !== undefined) caseUpdateData.address = address;
    if (city !== undefined) caseUpdateData.city = city;
    if (contact_phone !== undefined) caseUpdateData.contact_phone = contact_phone;
    if (contact_phone2 !== undefined) caseUpdateData.contact_phone2 = contact_phone2;
    if (contact_phone3 !== undefined) caseUpdateData.contact_phone3 = contact_phone3;
    if (contact_email !== undefined) caseUpdateData.contact_email = contact_email;

    if (Object.keys(caseUpdateData).length > 0) {
      caseUpdateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('cases')
        .update(caseUpdateData)
        .eq('id', id)
        .eq('case_type', 'cleaning');

      if (updateError) {
        console.error('Error updating case:', updateError);
        return NextResponse.json(
          { error: 'Failed to update case', details: updateError.message },
          { status: 500 }
        );
      }
    }

    // Update bank details if provided
    if (bank_details) {
      const { error: bankError } = await supabase
        .from('bank_details')
        .upsert({
          case_id: id,
          bank_number: bank_details.bank_number,
          branch: bank_details.branch,
          account_number: bank_details.account_number,
          account_holder_name: bank_details.account_holder_name,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'case_id',
        });

      if (bankError) {
        console.error('Error updating bank details:', bankError);
        return NextResponse.json(
          { error: 'Failed to update bank details', details: bankError.message },
          { status: 500 }
        );
      }
    }

    // Log to case_history
    await supabase.from('case_history').insert({
      case_id: id,
      changed_by: user.id,
      field_changed: 'details',
      new_value: JSON.stringify(body),
      note: 'case_details_updated',
      changed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Case updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/cleaning-cases/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
