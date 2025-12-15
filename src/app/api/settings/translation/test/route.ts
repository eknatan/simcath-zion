/**
 * API Route: Test Translation Provider
 * נתיב API לבדיקת ספק תרגום
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserAuth } from '@/lib/email/auth-middleware';
import { TranslationProvider, translationFactory } from '@/lib/services/translation-factory';
import { settingsService } from '@/lib/settings/settings-service';

/**
 * POST - Test a translation provider
 */
export async function POST(request: NextRequest) {
  try {
    // Check authorization - only managers
    const auth = await checkUserAuth(request);
    if (!auth.authorized || auth.userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Only managers can test translation providers' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { provider } = body as { provider: TranslationProvider };

    // Validate provider
    if (!provider || !['google', 'microsoft', 'groq'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be google, microsoft, or groq' },
        { status: 400 }
      );
    }

    // Load current API keys from database before testing
    // settingsService.getSetting() already returns setting_value directly
    const apiKeys = await settingsService.getSetting('translation_api_keys');
    if (apiKeys) {
      translationFactory.setApiKeys(apiKeys as any);
    }

    // Test the provider
    const result = await translationFactory.testProvider(provider);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      provider,
    });
  } catch (error) {
    console.error('Error in POST /api/settings/translation/test:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      },
      { status: 500 }
    );
  }
}
