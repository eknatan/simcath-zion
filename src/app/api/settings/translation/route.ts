/**
 * API Route: Translation Settings
 * נתיב API לניהול הגדרות תרגום
 */

import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/settings/settings-service';
import { checkUserAuth } from '@/lib/email/auth-middleware';
import { TranslationProvider, translationFactory } from '@/lib/services/translation-factory';

// ========================================
// Types
// ========================================

interface TranslationSettings {
  provider: TranslationProvider;
  google_api_key?: string;
  microsoft_translator_key?: string;
  microsoft_translator_region?: string;
  groq_api_key?: string;
}

// ========================================
// Helper Functions
// ========================================

/**
 * Mask API key for display (show first 6 and last 4 characters)
 */
function maskApiKey(key: string | undefined): string {
  if (!key || key.length < 12) return key ? '********' : '';
  return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
}

/**
 * Get translation settings from database
 */
async function getTranslationSettings(): Promise<TranslationSettings> {
  const providerSetting = await settingsService.getSetting('translation_provider');
  const apiKeysSetting = await settingsService.getSetting('translation_api_keys');

  // settingsService.getSetting() already returns setting_value directly
  const provider = (providerSetting as any)?.provider || 'microsoft';
  const apiKeys = (apiKeysSetting as any) || {};

  return {
    provider,
    google_api_key: apiKeys.google_api_key,
    microsoft_translator_key: apiKeys.microsoft_translator_key,
    microsoft_translator_region: apiKeys.microsoft_translator_region || 'eastus',
    groq_api_key: apiKeys.groq_api_key,
  };
}

/**
 * Save translation settings to database
 */
async function saveTranslationSettings(settings: Partial<TranslationSettings>): Promise<void> {
  // Get current settings
  const current = await getTranslationSettings();

  // Update provider if provided
  if (settings.provider) {
    await settingsService.updateSetting('translation_provider', {
      provider: settings.provider,
    });
  }

  // Update API keys (merge with existing) - only update if new value is non-empty
  const apiKeys = {
    google_api_key: settings.google_api_key ? settings.google_api_key : current.google_api_key,
    microsoft_translator_key: settings.microsoft_translator_key ? settings.microsoft_translator_key : current.microsoft_translator_key,
    microsoft_translator_region: settings.microsoft_translator_region || current.microsoft_translator_region || 'eastus',
    groq_api_key: settings.groq_api_key ? settings.groq_api_key : current.groq_api_key,
  };

  await settingsService.updateSetting('translation_api_keys', apiKeys);

  // Update the factory with new keys
  translationFactory.setApiKeys(apiKeys);
  if (settings.provider) {
    translationFactory.setDefaultProvider(settings.provider);
  }
}

// ========================================
// API Routes
// ========================================

/**
 * GET - Get translation settings
 */
export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const auth = await checkUserAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getTranslationSettings();

    // Return settings with masked API keys
    return NextResponse.json({
      success: true,
      settings: {
        provider: settings.provider,
        google_api_key: maskApiKey(settings.google_api_key),
        microsoft_translator_key: maskApiKey(settings.microsoft_translator_key),
        microsoft_translator_region: settings.microsoft_translator_region,
        groq_api_key: maskApiKey(settings.groq_api_key),
        // Include whether each key is configured
        hasGoogleKey: !!settings.google_api_key,
        hasMicrosoftKey: !!settings.microsoft_translator_key,
        hasGroqKey: !!settings.groq_api_key,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/settings/translation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update translation settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authorization - only managers
    const auth = await checkUserAuth(request);
    if (!auth.authorized || auth.userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Only managers can update translation settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { provider, google_api_key, microsoft_translator_key, microsoft_translator_region, groq_api_key } = body;

    // Validate provider
    if (provider && !['google', 'microsoft', 'groq'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be google, microsoft, or groq' },
        { status: 400 }
      );
    }

    // Save settings
    await saveTranslationSettings({
      provider,
      google_api_key,
      microsoft_translator_key,
      microsoft_translator_region,
      groq_api_key,
    });

    return NextResponse.json({
      success: true,
      message: 'Translation settings updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/settings/translation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
