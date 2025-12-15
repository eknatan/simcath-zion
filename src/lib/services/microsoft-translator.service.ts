import { HDate } from '@hebcal/core';
import { WeddingFormData, CleaningFormData, CaseType, TranslatedContent } from '@/types/case.types';

/**
 * Format Hebrew date from structured fields for translation
 */
function formatHebrewDateForTranslation(day: number | null | undefined, month: number | null | undefined, year: number | null | undefined): string {
  if (!day || !month || !year) return '';
  try {
    const hdate = new HDate(day, month, year);
    return hdate.render('he');
  } catch {
    return '';
  }
}

/**
 * Format Gregorian date to English readable format
 */
function formatGregorianDateToEnglish(date: string): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return date;
    }
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return date;
  }
}

// ========================================
// Types
// ========================================

/**
 * Translation request structure
 */
export interface TranslationRequest {
  caseType: CaseType;
  hebrewData: WeddingFormData | CleaningFormData;
}

/**
 * API response structure
 */
export interface TranslationResponse {
  success: boolean;
  data?: TranslatedContent;
  error?: string;
}

/**
 * Microsoft Translator response
 */
interface MicrosoftTranslatorAPIResponse {
  translations: Array<{
    text: string;
    to: string;
  }>;
}

// ========================================
// Microsoft Translator Service
// ========================================

/**
 * Microsoft Translator Service - Hebrew to English translation
 *
 * Features:
 * - Integration with Microsoft Translator API
 * - Batch translation for efficiency (2M characters/month free)
 * - Structured JSON response building
 * - Error handling
 */
export class MicrosoftTranslatorService {
  private apiKey: string;
  private region: string;
  private endpoint = 'https://api.cognitive.microsofttranslator.com';

  constructor() {
    this.apiKey = process.env.MICROSOFT_TRANSLATOR_KEY || '';
    this.region = process.env.MICROSOFT_TRANSLATOR_REGION || 'eastus';

    console.log('MicrosoftTranslatorService initialized');
    console.log('API key:', this.apiKey ? '✓ Present' : '✗ Missing');
    console.log('Region:', this.region);

    if (!this.apiKey) {
      throw new Error('MICROSOFT_TRANSLATOR_KEY environment variable is required');
    }
  }

  // ========================================
  // Public Methods
  // ========================================

  /**
   * Translate case data from Hebrew to English
   */
  async translateCase(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const { caseType, hebrewData } = request;

      if (caseType === CaseType.WEDDING) {
        const translatedData = await this.translateWeddingCase(hebrewData as WeddingFormData);
        return { success: true, data: translatedData };
      } else {
        const translatedData = await this.translateCleaningCase(hebrewData as CleaningFormData);
        return { success: true, data: translatedData };
      }
    } catch (error) {
      console.error('Microsoft Translation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
      };
    }
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Translate wedding case data
   */
  private async translateWeddingCase(data: WeddingFormData): Promise<TranslatedContent> {
    // Collect all Hebrew texts to translate
    const hebrewDateStr = formatHebrewDateForTranslation(data.hebrew_day, data.hebrew_month, data.hebrew_year) || data.wedding_date_hebrew || '';

    const textsToTranslate = [
      hebrewDateStr,                    // 0
      data.city || '',                  // 1
      data.venue || '',                 // 2
      data.request_background || '',    // 3
      data.groom_first_name || '',      // 4
      data.groom_last_name || '',       // 5
      data.groom_school || '',          // 6
      data.groom_father_name || '',     // 7
      data.groom_mother_name || '',     // 8
      data.groom_memorial_day || '',    // 9
      data.bride_first_name || '',      // 10
      data.bride_last_name || '',       // 11
      data.bride_school || '',          // 12
      data.bride_father_name || '',     // 13
      data.bride_mother_name || '',     // 14
      data.bride_memorial_day || '',    // 15
      data.address || '',               // 16
    ];

    // Translate all texts in batch
    const translations = await this.translateBatch(textsToTranslate);

    // Format Gregorian date
    const formattedGregorianDate = data.wedding_date_gregorian
      ? formatGregorianDateToEnglish(data.wedding_date_gregorian)
      : '';

    // Build structured response
    return {
      wedding_info: {
        wedding_date_hebrew: translations[0] || hebrewDateStr,
        wedding_date_gregorian: formattedGregorianDate,
        city: translations[1] || data.city || '',
        venue: translations[2] || data.venue || '',
        guests_count: data.guests_count || 0,
        total_cost: data.total_cost || 0,
        request_background: translations[3] || data.request_background || '',
      },
      groom_info: {
        first_name: translations[4] || data.groom_first_name || '',
        last_name: translations[5] || data.groom_last_name || '',
        id_number: data.groom_id || '',
        school: translations[6] || data.groom_school || '',
        father_name: translations[7] || data.groom_father_name || '',
        mother_name: translations[8] || data.groom_mother_name || '',
        memorial_day: translations[9] || data.groom_memorial_day || '',
      },
      bride_info: {
        first_name: translations[10] || data.bride_first_name || '',
        last_name: translations[11] || data.bride_last_name || '',
        id_number: data.bride_id || '',
        school: translations[12] || data.bride_school || '',
        father_name: translations[13] || data.bride_father_name || '',
        mother_name: translations[14] || data.bride_mother_name || '',
        memorial_day: translations[15] || data.bride_memorial_day || '',
      },
      contact_info: {
        address: translations[16] || data.address || '',
        phone: data.contact_phone || '',
        email: data.contact_email || '',
      },
    };
  }

  /**
   * Translate cleaning case data
   */
  private async translateCleaningCase(data: CleaningFormData): Promise<TranslatedContent> {
    // Collect all Hebrew texts to translate
    const textsToTranslate = [
      data.family_name || '',     // 0
      data.child_name || '',      // 1
      data.parent1_name || '',    // 2
      data.parent2_name || '',    // 3
      data.address || '',         // 4
      data.city || '',            // 5
    ];

    // Translate all texts in batch
    const translations = await this.translateBatch(textsToTranslate);

    // Format start date
    const formattedStartDate = data.start_date
      ? formatGregorianDateToEnglish(data.start_date)
      : '';

    // Build structured response
    return {
      family_info: {
        family_name: translations[0] || data.family_name || '',
        child_name: translations[1] || data.child_name || '',
        parent1_name: translations[2] || data.parent1_name || '',
        parent1_id: data.parent1_id || '',
        parent2_name: translations[3] || data.parent2_name || '',
        parent2_id: data.parent2_id || '',
        address: translations[4] || data.address || '',
        city: translations[5] || data.city || '',
        phone: data.contact_phone || '',
        phone2: data.contact_phone2 || '',
        phone3: data.contact_phone3 || '',
        email: data.contact_email || '',
        start_date: formattedStartDate,
      },
    };
  }

  /**
   * Translate multiple texts in a single API call
   */
  private async translateBatch(texts: string[]): Promise<string[]> {
    // Filter out empty strings but keep track of indices
    const nonEmptyTexts: { index: number; text: string }[] = [];
    texts.forEach((text, index) => {
      if (text && text.trim()) {
        nonEmptyTexts.push({ index, text: text.trim() });
      }
    });

    if (nonEmptyTexts.length === 0) {
      return texts.map(() => '');
    }

    console.log(`Translating ${nonEmptyTexts.length} texts with Microsoft Translator...`);

    try {
      const response = await fetch(
        `${this.endpoint}/translate?api-version=3.0&from=he&to=en`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Ocp-Apim-Subscription-Region': this.region,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nonEmptyTexts.map(item => ({ Text: item.text }))),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Microsoft Translator error:', response.status, errorText);
        throw new Error(`Microsoft Translator API error: ${response.status} - ${errorText}`);
      }

      const results: MicrosoftTranslatorAPIResponse[] = await response.json();
      console.log('Microsoft Translator response received successfully');

      // Map results back to original indices
      const translatedTexts = texts.map(() => '');
      nonEmptyTexts.forEach((item, i) => {
        if (results[i]?.translations?.[0]?.text) {
          translatedTexts[item.index] = results[i].translations[0].text;
        }
      });

      return translatedTexts;
    } catch (error) {
      console.error('Microsoft Translator API error:', error);
      throw error;
    }
  }
}
