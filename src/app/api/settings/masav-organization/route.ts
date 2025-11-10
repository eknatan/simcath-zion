import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getMasavOrganizationSettings,
  updateSetting,
  type MasavOrganizationSettings,
} from '@/lib/services/settings.service';

/**
 * GET /api/settings/masav-organization
 * Get MASAV organization settings
 */
export async function GET() {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get settings
    const settings = await getMasavOrganizationSettings();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching MASAV settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch MASAV settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/masav-organization
 * Update MASAV organization settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { settings } = body as { settings: MasavOrganizationSettings };

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields: (keyof MasavOrganizationSettings)[] = [
      'institution_id',
      'institution_name',
      'bank_code',
      'branch_code',
      'account_number',
      'sequence_number',
    ];

    for (const field of requiredFields) {
      if (!settings[field] || settings[field].toString().trim() === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate formats
    if (!/^\d{8}$/.test(settings.institution_id)) {
      return NextResponse.json(
        { error: 'Institution ID must be exactly 8 digits' },
        { status: 400 }
      );
    }

    if (!/^\d{2}$/.test(settings.bank_code)) {
      return NextResponse.json(
        { error: 'Bank code must be exactly 2 digits' },
        { status: 400 }
      );
    }

    if (!/^\d{3}$/.test(settings.branch_code)) {
      return NextResponse.json(
        { error: 'Branch code must be exactly 3 digits' },
        { status: 400 }
      );
    }

    if (!/^\d+$/.test(settings.account_number)) {
      return NextResponse.json(
        { error: 'Account number must contain only digits' },
        { status: 400 }
      );
    }

    if (settings.account_number.length > 20) {
      return NextResponse.json(
        { error: 'Account number must be at most 20 digits' },
        { status: 400 }
      );
    }

    if (!/^\d{3}$/.test(settings.sequence_number)) {
      return NextResponse.json(
        { error: 'Sequence number must be exactly 3 digits' },
        { status: 400 }
      );
    }

    // Update settings
    await updateSetting('masav_organization', settings, user.id);

    return NextResponse.json({
      success: true,
      settings,
      message: 'MASAV settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating MASAV settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to update MASAV settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
