import { TranslationService, TranslationRequest, TranslationResponse } from './translation.service';
import { MicrosoftTranslatorService } from './microsoft-translator.service';

// ========================================
// Types
// ========================================

export type TranslationProvider = 'google' | 'microsoft';

export interface TranslationServiceInterface {
  translateCase(request: TranslationRequest): Promise<TranslationResponse>;
}

// ========================================
// Translation Factory
// ========================================

/**
 * Translation Factory - Manages translation provider selection
 *
 * Supports:
 * - Google Gemini AI (default)
 * - Microsoft Translator (free tier: 2M chars/month)
 */
class TranslationFactory {
  private googleService: TranslationService | null = null;
  private microsoftService: MicrosoftTranslatorService | null = null;
  private defaultProvider: TranslationProvider = 'microsoft'; // Default to Microsoft since Google quota is exceeded

  /**
   * Get the Google Gemini translation service
   */
  private getGoogleService(): TranslationService {
    if (!this.googleService) {
      this.googleService = new TranslationService();
    }
    return this.googleService;
  }

  /**
   * Get the Microsoft Translator service
   */
  private getMicrosoftService(): MicrosoftTranslatorService {
    if (!this.microsoftService) {
      this.microsoftService = new MicrosoftTranslatorService();
    }
    return this.microsoftService;
  }

  /**
   * Get translation service based on provider
   */
  getService(provider?: TranslationProvider): TranslationServiceInterface {
    const selectedProvider = provider || this.defaultProvider;

    console.log(`Using translation provider: ${selectedProvider}`);

    switch (selectedProvider) {
      case 'google':
        return this.getGoogleService();
      case 'microsoft':
        return this.getMicrosoftService();
      default:
        return this.getMicrosoftService();
    }
  }

  /**
   * Translate with automatic fallback
   * If the primary provider fails, try the fallback
   */
  async translateWithFallback(
    request: TranslationRequest,
    primaryProvider?: TranslationProvider
  ): Promise<TranslationResponse> {
    const primary = primaryProvider || this.defaultProvider;
    const fallback: TranslationProvider = primary === 'google' ? 'microsoft' : 'google';

    console.log(`Attempting translation with ${primary}, fallback: ${fallback}`);

    try {
      // Try primary provider
      const primaryService = this.getService(primary);
      const result = await primaryService.translateCase(request);

      if (result.success) {
        return result;
      }

      // If primary failed, try fallback
      console.log(`Primary provider ${primary} failed, trying fallback ${fallback}...`);
      const fallbackService = this.getService(fallback);
      return await fallbackService.translateCase(request);

    } catch (error) {
      console.error(`Primary provider ${primary} threw error:`, error);

      // Try fallback on error
      try {
        console.log(`Trying fallback provider ${fallback}...`);
        const fallbackService = this.getService(fallback);
        return await fallbackService.translateCase(request);
      } catch (fallbackError) {
        console.error(`Fallback provider ${fallback} also failed:`, fallbackError);
        return {
          success: false,
          error: `Both translation providers failed. Primary (${primary}): ${error instanceof Error ? error.message : 'Unknown error'}. Fallback (${fallback}): ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
        };
      }
    }
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(provider: TranslationProvider): void {
    this.defaultProvider = provider;
    console.log(`Default translation provider set to: ${provider}`);
  }

  /**
   * Get the current default provider
   */
  getDefaultProvider(): TranslationProvider {
    return this.defaultProvider;
  }

  /**
   * Check which providers are available (have API keys configured)
   */
  getAvailableProviders(): TranslationProvider[] {
    const available: TranslationProvider[] = [];

    if (process.env.GOOGLE_API_KEY) {
      available.push('google');
    }

    if (process.env.MICROSOFT_TRANSLATOR_KEY) {
      available.push('microsoft');
    }

    return available;
  }
}

// ========================================
// Singleton Instance
// ========================================

export const translationFactory = new TranslationFactory();

// ========================================
// Convenience Export
// ========================================

/**
 * Default translation function using factory
 * Uses Microsoft Translator by default (or falls back to Google)
 */
export async function translateCase(request: TranslationRequest): Promise<TranslationResponse> {
  return translationFactory.translateWithFallback(request);
}
