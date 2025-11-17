import { NextRequest } from 'next/server';
import { exportToMasavServer } from '@/lib/services/masav-server.service';
import { recordExport } from '@/lib/services/transfers.service';
import { PaymentType } from '@/types/case.types';
import { MasavUrgency } from '@/types/export.types';
import {
  authenticateExportRequest,
  validateExportRequest,
  fetchTransfersForExport,
  createFileResponse,
  createErrorResponse,
} from '@/lib/api/transfers-api.helpers';

/**
 * Convert PaymentType to export_type format expected by DB
 */
function convertPaymentTypeToExportType(paymentType: PaymentType): string {
  switch (paymentType) {
    case PaymentType.WEDDING_TRANSFER:
      return 'wedding';
    case PaymentType.MONTHLY_CLEANING:
      return 'cleaning';
    default:
      return 'mixed';
  }
}

/**
 * POST /api/transfers/export/masav
 * Export transfers to MASAV format
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { supabase, user } = await authenticateExportRequest();

    // Parse and validate request
    const body = await request.json();
    validateExportRequest(body);

    const { transfer_ids, payment_type, options = {} } = body;

    // Fetch transfers
    const transfers = await fetchTransfersForExport(supabase, transfer_ids);

    // Generate MASAV file
    const masavOptions = options as {
      urgency?: MasavUrgency;
      execution_date?: string;
      validate_before_export?: boolean;
      mark_as_transferred?: boolean;
    };

    const result = await exportToMasavServer(
      transfers,
      payment_type as PaymentType,
      {
        urgency: masavOptions.urgency || MasavUrgency.REGULAR,
        execution_date: masavOptions.execution_date,
        validate_before_export: masavOptions.validate_before_export !== false,
        ...options,
      }
    );

    // Record export in database
    try {
      await recordExport({
        export_type: convertPaymentTypeToExportType(payment_type as PaymentType),
        exported_by: user.id,
        filename: result.filename,
        cases_included: transfers.map((t) => ({
          case_id: t.case_id,
          case_number: t.case.case_number,
          amount: t.amount_ils,
        })),
        total_amount: result.total_amount,
        total_count: result.total_count,
      }, supabase);
    } catch (recordError) {
      console.error('Failed to record export - Full error:', JSON.stringify(recordError, null, 2));
      // Continue even if recording fails
    }

    // Update payment statuses to 'transferred' if requested
    if (masavOptions.mark_as_transferred !== false) {
      try {
        await supabase
          .from('payments')
          .update({
            status: 'transferred',
            transferred_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in('id', transfer_ids);
      } catch (updateError) {
        console.error('Failed to update payment statuses:', updateError);
        // Continue even if update fails
      }
    }

    // Convert blob to buffer for response
    const arrayBuffer = await result.file_blob!.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return file response
    return createFileResponse(
      buffer,
      result.filename,
      'text/plain;charset=windows-1255'
    );
  } catch (error) {
    return createErrorResponse('Failed to export MASAV', error);
  }
}
