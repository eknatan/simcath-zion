import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMasavOrganizationSettings } from '@/lib/services/settings.service';
import { UnifiedMasavService } from '@/lib/services/masav-unified.service';
import { ManualTransferStatus, type ManualTransfer } from '@/types/manual-transfers.types';

/**
 * POST /api/manual-transfers/export/masav
 * Generate MASAV file for selected manual transfers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transfer_ids, payment_date } = body;

    if (!transfer_ids || !Array.isArray(transfer_ids) || transfer_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid transfer_ids' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get MASAV organization settings
    const settings = await getMasavOrganizationSettings();

    if (!settings) {
      return NextResponse.json(
        { error: 'MASAV settings not configured' },
        { status: 500 }
      );
    }

    // Get selected manual transfers using server-side Supabase
    const { data: selectedTransfers, error: transfersError } = await (supabase as any)
      .from('manual_transfers')
      .select('*')
      .in('id', transfer_ids);

    if (transfersError) {
      return NextResponse.json(
        { error: 'Failed to fetch transfers', message: transfersError.message },
        { status: 500 }
      );
    }

    if (!selectedTransfers || selectedTransfers.length === 0) {
      return NextResponse.json(
        { error: 'No transfers found with provided IDs' },
        { status: 404 }
      );
    }

    // Generate MASAV file using unified service
    const result = await UnifiedMasavService.generateFromManualTransfers(
      settings,
      selectedTransfers as unknown as ManualTransfer[],
      {
        paymentDate: payment_date ? new Date(payment_date) : new Date(),
        fileExtension: 'txt',
      }
    );

    // Update transfer statuses to 'exported' using server-side Supabase
    await (supabase as any)
      .from('manual_transfers')
      .update({ status: ManualTransferStatus.EXPORTED })
      .in('id', transfer_ids);

    // Create export record for audit trail
    // TODO: Save to manual_transfers_export table

    // Return file as download
    return new NextResponse(result.fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
      },
    });
  } catch (error) {
    console.error('MASAV export error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate MASAV file',
      },
      { status: 500 }
    );
  }
}
