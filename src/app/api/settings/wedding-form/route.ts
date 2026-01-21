import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getWeddingFormSettings,
  updateSetting,
  type WeddingFormSettings,
} from '@/lib/services/settings.service';

/**
 * GET /api/settings/wedding-form
 * Get wedding form settings (public - no auth required for form to fetch limits)
 */
export async function GET() {
  try {
    const settings = await getWeddingFormSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching wedding form settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch wedding form settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/wedding-form
 * Update wedding form settings (requires authentication)
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
    const { settings } = body as { settings: WeddingFormSettings };

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Validate background_word_limit
    if (
      typeof settings.background_word_limit !== 'number' ||
      settings.background_word_limit < 1 ||
      settings.background_word_limit > 10000
    ) {
      return NextResponse.json(
        { error: 'background_word_limit must be a number between 1 and 10000' },
        { status: 400 }
      );
    }

    // Update settings
    await updateSetting('wedding_form_settings', settings, user.id);

    return NextResponse.json({
      success: true,
      settings,
      message: 'Wedding form settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating wedding form settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to update wedding form settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
