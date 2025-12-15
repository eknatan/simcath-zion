import Groq from 'groq-sdk';
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

// ========================================
// Groq Translator Service
// ========================================

/**
 * Groq Translator Service - Llama 3.3 70B powered Hebrew to English translation
 *
 * Features:
 * - Integration with Groq API (free, fast inference)
 * - Uses Llama 3.3 70B Versatile model
 * - Structured JSON response parsing
 * - Error handling
 */
export class GroqTranslatorService {
  private client: Groq;
  private model = 'llama-3.3-70b-versatile';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GROQ_API_KEY || '';

    console.log('GroqTranslatorService initialized');
    console.log('API key:', key ? '✓ Present' : '✗ Missing');

    if (!key) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.client = new Groq({ apiKey: key });
  }

  // ========================================
  // Public Methods
  // ========================================

  /**
   * Translate case data from Hebrew to English
   */
  async translateCase(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const prompt = this.buildTranslationPrompt(request);
      const response = await this.callGroqAPI(prompt);
      const translatedData = this.parseResponse(response);

      return {
        success: true,
        data: translatedData,
      };
    } catch (error) {
      console.error('Groq Translation failed:', error);
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
   * Build the translation prompt for Groq/Llama
   */
  private buildTranslationPrompt(request: TranslationRequest): string {
    const { caseType, hebrewData } = request;

    let prompt = `You are a professional translator for an Israeli non-profit organization.
Translate the following Hebrew case data to English.

IMPORTANT:
1. Translate ALL Hebrew text to English
2. Keep numbers, dates, and IDs as they are
3. Convert Hebrew dates to readable English format (e.g., "כ' בתשרי תשפ"ה" → "20th of Tishrei 5785")
4. Format Gregorian dates in English (e.g., "23/10/2024" → "October 23, 2024")
5. Return ONLY valid JSON format
6. Preserve the exact structure shown below
7. If any field is empty or null, omit it from the JSON

`;

    if (caseType === CaseType.WEDDING) {
      prompt += this.buildWeddingPrompt(hebrewData as WeddingFormData);
    } else {
      prompt += this.buildCleaningPrompt(hebrewData as CleaningFormData);
    }

    prompt += `

Respond with valid JSON only, no additional text or explanations.`;

    return prompt;
  }

  /**
   * Build wedding-specific prompt
   */
  private buildWeddingPrompt(data: WeddingFormData): string {
    const hebrewDateStr = formatHebrewDateForTranslation(data.hebrew_day, data.hebrew_month, data.hebrew_year) || data.wedding_date_hebrew || '';

    return `
WEDDING CASE TRANSLATION:
Hebrew Data:
{
  "wedding_date_hebrew": "${hebrewDateStr}",
  "wedding_date_gregorian": "${data.wedding_date_gregorian || ''}",
  "city": "${data.city || ''}",
  "venue": "${data.venue || ''}",
  "guests_count": ${data.guests_count || 0},
  "total_cost": ${data.total_cost || 0},
  "request_background": "${data.request_background || ''}",
  "groom_first_name": "${data.groom_first_name || ''}",
  "groom_last_name": "${data.groom_last_name || ''}",
  "groom_id": "${data.groom_id || ''}",
  "groom_school": "${data.groom_school || ''}",
  "groom_father_name": "${data.groom_father_name || ''}",
  "groom_mother_name": "${data.groom_mother_name || ''}",
  "groom_memorial_day": "${data.groom_memorial_day || ''}",
  "bride_first_name": "${data.bride_first_name || ''}",
  "bride_last_name": "${data.bride_last_name || ''}",
  "bride_id": "${data.bride_id || ''}",
  "bride_school": "${data.bride_school || ''}",
  "bride_father_name": "${data.bride_father_name || ''}",
  "bride_mother_name": "${data.bride_mother_name || ''}",
  "bride_memorial_day": "${data.bride_memorial_day || ''}",
  "address": "${data.address || ''}",
  "contact_phone": "${data.contact_phone || ''}",
  "contact_email": "${data.contact_email || ''}"
}

Expected JSON Response Structure:
{
  "wedding_info": {
    "wedding_date_hebrew": "Translated Hebrew date",
    "wedding_date_gregorian": "Formatted Gregorian date",
    "city": "City name in English",
    "venue": "Venue name in English",
    "guests_count": number,
    "total_cost": number,
    "request_background": "Background in English"
  },
  "groom_info": {
    "first_name": "Translated first name",
    "last_name": "Translated last name",
    "id_number": "ID number",
    "school": "School name in English",
    "father_name": "Father name in English",
    "mother_name": "Mother name in English",
    "memorial_day": "Memorial day in English"
  },
  "bride_info": {
    "first_name": "Translated first name",
    "last_name": "Translated last name",
    "id_number": "ID number",
    "school": "School name in English",
    "father_name": "Father name in English",
    "mother_name": "Mother name in English",
    "memorial_day": "Memorial day in English"
  },
  "contact_info": {
    "address": "Address in English",
    "phone": "Phone number",
    "email": "Email address"
  }
}
`;
  }

  /**
   * Build cleaning (sick children) specific prompt
   */
  private buildCleaningPrompt(data: CleaningFormData): string {
    return `
SICK CHILDREN SUPPORT CASE TRANSLATION:
Hebrew Data:
{
  "family_name": "${data.family_name || ''}",
  "child_name": "${data.child_name || ''}",
  "parent1_name": "${data.parent1_name || ''}",
  "parent1_id": "${data.parent1_id || ''}",
  "parent2_name": "${data.parent2_name || ''}",
  "parent2_id": "${data.parent2_id || ''}",
  "address": "${data.address || ''}",
  "city": "${data.city || ''}",
  "contact_phone": "${data.contact_phone || ''}",
  "contact_phone2": "${data.contact_phone2 || ''}",
  "contact_phone3": "${data.contact_phone3 || ''}",
  "contact_email": "${data.contact_email || ''}",
  "start_date": "${data.start_date || ''}"
}

Expected JSON Response Structure:
{
  "family_info": {
    "family_name": "Translated family name",
    "child_name": "Translated child name",
    "parent1_name": "Parent 1 name in English",
    "parent1_id": "Parent 1 ID",
    "parent2_name": "Parent 2 name in English",
    "parent2_id": "Parent 2 ID",
    "address": "Address in English",
    "city": "City name in English",
    "phone": "Primary phone",
    "phone2": "Secondary phone",
    "phone3": "Third phone",
    "email": "Email address",
    "start_date": "Formatted start date"
  }
}
`;
  }

  /**
   * Call Groq API using official SDK
   */
  private async callGroqAPI(prompt: string): Promise<string> {
    console.log('Calling Groq API with Llama 3.3 70B...');

    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a professional Hebrew to English translator. Always respond with valid JSON only, no markdown formatting or additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.3, // Lower for more consistent translations
        max_tokens: 4096,
      });

      const response = chatCompletion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('Empty response from Groq API');
      }

      console.log('Groq API response received successfully');
      return response;
    } catch (error) {
      console.error('Groq API error:', error);

      if (error instanceof Groq.APIError) {
        if (error.status === 429) {
          throw new Error('Groq API rate limit exceeded. Please try again later.');
        }
        if (error.status === 401) {
          throw new Error('Groq API key authentication failed. Check API key.');
        }
        throw new Error(`Groq API error: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Parse JSON response from AI
   */
  private parseResponse(response: string): TranslatedContent {
    try {
      // Clean up the response - remove any markdown formatting
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();

      // Parse JSON
      const parsed = JSON.parse(cleanResponse);

      // Validate structure
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid JSON structure');
      }

      return parsed as TranslatedContent;
    } catch (error) {
      console.error('Failed to parse Groq translation response:', error);
      console.error('Raw response:', response);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }
}
