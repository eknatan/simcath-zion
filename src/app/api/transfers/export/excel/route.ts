import { NextRequest } from 'next/server';
import { exportToExcel } from '@/lib/services/export.service';
import { recordExport } from '@/lib/services/transfers.service';
import { PaymentType } from '@/types/case.types';
import { ExportType } from '@/types/export.types';
import {
  authenticateExportRequest,
  validateExportRequest,
  fetchTransfersForExport,
  createFileResponse,
  createErrorResponse,
} from '@/lib/api/transfers-api.helpers';

/**
 * POST /api/transfers/export/excel
 * Export transfers to Excel format
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

    // Generate Excel file
    const exportOptions = options as {
      locale?: string;
      include_headers?: boolean;
      include_summary?: boolean;
    };

    const result = await exportToExcel(transfers, payment_type as PaymentType, {
      locale: exportOptions.locale || 'he',
      include_headers: exportOptions.include_headers !== false,
      include_summary: exportOptions.include_summary !== false,
      ...options,
    });

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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  } catch (error) {
    return createErrorResponse('Failed to export Excel', error);
  }
}
