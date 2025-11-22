import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BankDetailsFormData } from '@/types/case.types';

/**
 * GET /api/cases/[id]/bank-details
 *
 * Fetch bank details for a specific case
 *
 * @param request - Next.js request object
 * @param params - Route params containing case ID
 * @returns Bank details or null if not found
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
    // Fetch Bank Details
    // ========================================
    const { data: bankDetails, error: bankError } = await supabase
      .from('bank_details')
      .select('*')
      .eq('case_id', caseId)
      .maybeSingle(); // Use maybeSingle to avoid error when not found

    if (bankError) {
      console.error('Failed to fetch bank details:', bankError);
      return NextResponse.json(
        {
          message: 'Failed to fetch bank details',
          error: bankError.message,
        },
        { status: 500 }
      );
    }

    console.log('[GET /bank-details] Fetched bank details for case', caseId, ':', bankDetails);

    // Return null if not found (not an error)
    return NextResponse.json(bankDetails);
  } catch (error) {
    console.error('Error in GET /api/cases/[id]/bank-details:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases/[id]/bank-details
 *
 * Create or update bank details for a case
 *
 * @param request - Next.js request object with BankDetailsFormData
 * @param params - Route params containing case ID
 * @returns Created/updated bank details
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
    const body: BankDetailsFormData = await request.json();
    const { bank_number, branch, account_number, account_holder_name } = body;

    console.log('[POST /bank-details] Received data for case', caseId, ':', body);

    // Validate required fields
    if (!bank_number || !branch || !account_number || !account_holder_name) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate formats
    if (account_number.length < 2 || account_number.length > 20) {
      return NextResponse.json(
        { message: 'Account number must be between 2-20 digits' },
        { status: 400 }
      );
    }

    // ========================================
    // Check if Bank Details Already Exist
    // ========================================
    const { data: existing, error: existingError } = await supabase
      .from('bank_details')
      .select('id')
      .eq('case_id', caseId)
      .maybeSingle();

    if (existingError) {
      console.error('Failed to check existing bank details:', existingError);
      return NextResponse.json(
        {
          message: 'Failed to check existing bank details',
          error: existingError.message,
        },
        { status: 500 }
      );
    }

    // ========================================
    // Upsert Bank Details
    // ========================================
    let bankDetails;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('bank_details')
        .update({
          bank_number,
          branch,
          account_number,
          account_holder_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update bank details:', error);
        return NextResponse.json(
          { message: 'Failed to update bank details', error: error.message },
          { status: 500 }
        );
      }

      bankDetails = data;

      console.log('[POST /bank-details] Updated existing bank details:', data);

      // ========================================
      // Log Update in Case History
      // ========================================
      await supabase.from('case_history').insert({
        case_id: caseId,
        changed_by: user.id,
        field_changed: 'bank_details',
        old_value: null,
        new_value: `${bank_number}-${branch}-${account_number}`,
        note: `bank_details_updated|holder:${account_holder_name}`,
      });
    } else {
      // Create new
      const { data, error } = await supabase
        .from('bank_details')
        .insert({
          case_id: caseId,
          bank_number,
          branch,
          account_number,
          account_holder_name,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create bank details:', error);
        return NextResponse.json(
          { message: 'Failed to create bank details', error: error.message },
          { status: 500 }
        );
      }

      bankDetails = data;

      console.log('[POST /bank-details] Created new bank details:', data);

      // ========================================
      // Log Creation in Case History
      // ========================================
      await supabase.from('case_history').insert({
        case_id: caseId,
        changed_by: user.id,
        field_changed: 'bank_details',
        old_value: null,
        new_value: `${bank_number}-${branch}-${account_number}`,
        note: `bank_details_added|holder:${account_holder_name}`,
      });
    }

    // ========================================
    // Return Success
    // ========================================
    console.log('[POST /bank-details] Returning bank details:', bankDetails);
    return NextResponse.json(bankDetails, {
      status: existing ? 200 : 201,
    });
  } catch (error) {
    console.error('Error in POST /api/cases/[id]/bank-details:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
