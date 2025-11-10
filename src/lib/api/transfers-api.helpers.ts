/**
 * Transfers API Helpers
 *
 * Shared utilities for transfers export API routes.
 * Eliminates code duplication between Excel and MASAV export endpoints.
 *
 * SOLID Principles:
 * - Single Responsibility: Each function has one clear purpose
 * - Dependency Inversion: Works with Supabase abstraction
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TransferWithDetails } from '@/types/transfers.types';
import { PaymentType } from '@/types/case.types';
import type { SupabaseClient } from '@supabase/supabase-js';

// ========================================
// Types
// ========================================

interface AuthResult {
  supabase: SupabaseClient;
  user: { id: string; email?: string };
}

interface ValidationResult {
  valid: true;
}

interface ExportRequestBody {
  transfer_ids: string[];
  payment_type: PaymentType;
  options?: Record<string, unknown>;
}

// ========================================
// Authentication
// ========================================

/**
 * Authenticate user for export requests
 * Returns user and supabase client if authenticated
 * Throws NextResponse on authentication failure
 */
export async function authenticateExportRequest(): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return {
    supabase,
    user,
  };
}

// ========================================
// Request Validation
// ========================================

/**
 * Validate export request body
 * Ensures transfer_ids and payment_type are present
 * Throws NextResponse on validation failure
 */
export function validateExportRequest(
  body: Partial<ExportRequestBody>
): ValidationResult {
  // Validate transfer_ids
  if (!body.transfer_ids || !Array.isArray(body.transfer_ids)) {
    throw NextResponse.json(
      { error: 'Missing or invalid transfer_ids' },
      { status: 400 }
    );
  }

  if (body.transfer_ids.length === 0) {
    throw NextResponse.json(
      { error: 'transfer_ids array cannot be empty' },
      { status: 400 }
    );
  }

  // Validate payment_type
  if (!body.payment_type) {
    throw NextResponse.json(
      { error: 'Missing payment_type' },
      { status: 400 }
    );
  }

  return {
    valid: true,
  };
}

// ========================================
// Data Fetching
// ========================================

/**
 * Fetch transfers with full details for export
 * Includes case and bank_details relations
 * Throws NextResponse on fetch failure
 */
export async function fetchTransfersForExport(
  supabase: SupabaseClient,
  transferIds: string[]
): Promise<TransferWithDetails[]> {
  const { data: transfersData, error: fetchError } = await supabase
    .from('payments')
    .select(
      `
      *,
      cases!inner (
        id,
        case_number,
        case_type,
        status,
        groom_first_name,
        bride_first_name,
        bride_last_name,
        wedding_date_gregorian,
        family_name,
        child_name,
        city,
        bank_details (
          id,
          bank_number,
          branch,
          account_number,
          account_holder_name
        )
      )
    `
    )
    .in('id', transferIds);

  if (fetchError) {
    throw NextResponse.json(
      { error: 'Failed to fetch transfers', message: fetchError.message },
      { status: 500 }
    );
  }

  if (!transfersData || transfersData.length === 0) {
    throw NextResponse.json({ error: 'No transfers found' }, { status: 404 });
  }

  // Map data to TransferWithDetails type
  const transfers: TransferWithDetails[] = transfersData.map((item: {
    cases?: {
      bank_details?: unknown;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }) => {
    const bankDetails = item.cases?.bank_details;
    const normalizedBankDetails = Array.isArray(bankDetails)
      ? bankDetails[0]
      : bankDetails;

    return {
      ...item,
      case: item.cases,
      bank_details: normalizedBankDetails,
    } as TransferWithDetails;
  });

  return transfers;
}

// ========================================
// Response Helpers
// ========================================

/**
 * Create file download response
 * Sets appropriate headers for file download
 */
export function createFileResponse(
  buffer: Buffer,
  filename: string,
  contentType: string
): Response {
  // Convert Buffer to Uint8Array for Response constructor
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': buffer.length.toString(),
    },
  });
}

/**
 * Create error response
 * Consistent error response format
 */
export function createErrorResponse(
  message: string,
  error?: Error | unknown,
  status: number = 500
): NextResponse {
  console.error(`API Error: ${message}`, error);

  return NextResponse.json(
    {
      error: message,
      message: error instanceof Error ? error.message : String(error),
    },
    { status }
  );
}
