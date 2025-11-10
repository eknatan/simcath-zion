import { NextRequest } from 'next/server';
import { exportToMasavServer } from '@/lib/services/masav-server.service';
import { recordExport } from '@/lib/services/transfers.service';
import { PaymentType } from '@/types/case.types';
import { ExportType, MasavUrgency } from '@/types/export.types';
import {
  authenticateExportRequest,
  validateExportRequest,
  fetchTransfersForExport,
  createFileResponse,
  createErrorResponse,
} from '@/lib/api/transfers-api.helpers';

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
        export_type: payment_type,
        exported_by: user.id,
        filename: result.filename,
        cases_included: transfers.map((t) => ({
          case_id: t.case_id,
          case_number: t.case.case_number,
          amount: t.amount_ils,
        })),
        total_amount: result.total_amount,
        total_count: result.total_count,
      });
    } catch (recordError) {
      console.error('Failed to record export:', recordError);
      // Continue even if recording fails
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
