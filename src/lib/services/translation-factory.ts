import { TranslationService, TranslationRequest, TranslationResponse } from './translation.service';
import { MicrosoftTranslatorService } from './microsoft-translator.service';
import { GroqTranslatorService } from './groq-translator.service';

// ========================================
// Types
// ========================================

export type TranslationProvider = 'google' | 'microsoft' | 'groq';

export interface TranslationServiceInterface {
  translateCase(request: TranslationRequest): Promise<TranslationResponse>;
}

export interface TranslationApiKeys {
  google_api_key?: string;
  microsoft_translator_key?: string;
  microsoft_translator_region?: string;
  groq_api_key?: string;
}

// ========================================
// Translation Factory
// ========================================

/**
 * Translation Factory - Manages translation provider selection
 *
 * Supports:
 * - Google Gemini AI
 * - Microsoft Translator (free tier: 2M chars/month)
 * - Groq (Llama 3.3 70B - free & fast)
 */
class TranslationFactory {
  private googleService: TranslationService | null = null;
  private microsoftService: MicrosoftTranslatorService | null = null;
  private groqService: GroqTranslatorService | null = null;
  private defaultProvider: TranslationProvider = 'microsoft';
  private apiKeys: TranslationApiKeys = {};

  /**
   * Set API keys from database (called by API route)
   */
  setApiKeys(keys: TranslationApiKeys): void {
    this.apiKeys = keys;
    // Reset services to use new keys
    this.googleService = null;
    this.microsoftService = null;
    this.groqService = null;
    console.log('Translation API keys updated from database');
  }

  /**
   * Get the Google Gemini translation service
   */
  private getGoogleService(): TranslationService {
    if (!this.googleService) {
      // API key from DB takes precedence over env
      const apiKey = this.apiKeys.google_api_key || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error('Google API key not configured. Please add it in Settings > Translation.');
      }
      this.googleService = new TranslationService();
    }
    return this.googleService;
  }

  /**
   * Get the Microsoft Translator service
   */
  private getMicrosoftService(): MicrosoftTranslatorService {
    if (!this.microsoftService) {
      // API key from DB takes precedence over env
      const apiKey = this.apiKeys.microsoft_translator_key || process.env.MICROSOFT_TRANSLATOR_KEY;
      if (!apiKey) {
        throw new Error('Microsoft Translator API key not configured. Please add it in Settings > Translation.');
      }
      this.microsoftService = new MicrosoftTranslatorService();
    }
    return this.microsoftService;
  }

  /**
   * Get the Groq translation service
   */
  private getGroqService(): GroqTranslatorService {
    if (!this.groqService) {
      // API key from DB takes precedence over env
      const apiKey = this.apiKeys.groq_api_key || process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('Groq API key not configured. Please add it in Settings > Translation.');
      }
      this.groqService = new GroqTranslatorService(apiKey);
    }
    return this.groqService;
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
      case 'groq':
        return this.getGroqService();
      default:
        return this.getMicrosoftService();
    }
  }

  /**
   * Translate using the selected provider (no fallback)
   * Shows error if provider is not configured
   */
  async translate(
    request: TranslationRequest,
    provider?: TranslationProvider
  ): Promise<TranslationResponse> {
    const selectedProvider = provider || this.defaultProvider;

    console.log(`Translating with provider: ${selectedProvider}`);

    try {
      const service = this.getService(selectedProvider);
      return await service.translateCase(request);
    } catch (error) {
      console.error(`Provider ${selectedProvider} error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
      };
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

    // Define fallback order
    const fallbackOrder: TranslationProvider[] = ['microsoft', 'groq', 'google'];
    const fallbacks = fallbackOrder.filter(p => p !== primary);

    console.log(`Attempting translation with ${primary}, fallbacks: ${fallbacks.join(', ')}`);

    try {
      // Try primary provider
      const primaryService = this.getService(primary);
      const result = await primaryService.translateCase(request);

      if (result.success) {
        return result;
      }

      // If primary failed, try fallbacks
      for (const fallback of fallbacks) {
        try {
          console.log(`Primary provider ${primary} failed, trying fallback ${fallback}...`);
          const fallbackService = this.getService(fallback);
          const fallbackResult = await fallbackService.translateCase(request);
          if (fallbackResult.success) {
            return fallbackResult;
          }
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallback} failed:`, fallbackError);
        }
      }

      return {
        success: false,
        error: `All translation providers failed. Primary: ${result.error}`,
      };

    } catch (error) {
      console.error(`Primary provider ${primary} threw error:`, error);

      // Try fallbacks on error
      for (const fallback of fallbacks) {
        try {
          console.log(`Trying fallback provider ${fallback}...`);
          const fallbackService = this.getService(fallback);
          const result = await fallbackService.translateCase(request);
          if (result.success) {
            return result;
          }
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallback} also failed:`, fallbackError);
        }
      }

      return {
        success: false,
        error: `All translation providers failed. Primary (${primary}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
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

    if (this.apiKeys.google_api_key || process.env.GOOGLE_API_KEY) {
      available.push('google');
    }

    if (this.apiKeys.microsoft_translator_key || process.env.MICROSOFT_TRANSLATOR_KEY) {
      available.push('microsoft');
    }

    if (this.apiKeys.groq_api_key || process.env.GROQ_API_KEY) {
      available.push('groq');
    }

    return available;
  }

  /**
   * Test a specific provider with a simple translation
   */
  async testProvider(provider: TranslationProvider): Promise<{ success: boolean; message: string }> {
    console.log(`Testing translation provider: ${provider}`);

    try {
      const service = this.getService(provider);

      // Simple test translation
      const testRequest: TranslationRequest = {
        caseType: 'wedding' as any,
        hebrewData: {
          city: 'ירושלים',
          venue: 'אולם שמחות',
        } as any,
      };

      const result = await service.translateCase(testRequest);

      if (result.success) {
        return {
          success: true,
          message: `${provider} is working correctly`,
        };
      } else {
        return {
          success: false,
          message: result.error || 'Translation test failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Provider test failed',
      };
    }
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
 * Uses the default provider (configurable in settings)
 */
export async function translateCase(request: TranslationRequest): Promise<TranslationResponse> {
  return translationFactory.translate(request);
}
