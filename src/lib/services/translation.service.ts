import { GoogleGenerativeAI } from '@google/generative-ai';
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
// Translation Service
// ========================================

/**
 * Translation Service - AI-powered Hebrew to English translation
 *
 * Features:
 * - Integration with Google Gemini AI SDK
 * - Structured JSON response parsing
 * - Error handling and retry logic
 * - Type-safe translation mapping
 */
export class TranslationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY || '';
    console.log('TranslationService initialized with API key:', apiKey ? '✓ Present' : '✗ Missing');
    console.log('API key length:', apiKey.length);

    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }

    // Initialize with the official Google SDK
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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
      const response = await this.callGeminiAPI(prompt);
      const translatedData = this.parseResponse(response);

      return {
        success: true,
        data: translatedData,
      };
    } catch (error) {
      console.error('Translation failed:', error);
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
   * Build the translation prompt for Gemini AI
   */
  private buildTranslationPrompt(request: TranslationRequest): string {
    const { caseType, hebrewData } = request;

    // Base prompt instructions
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
    // Use structured date fields if available, fallback to legacy field
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
   * Call Gemini AI using official Google SDK
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    console.log('Calling Gemini AI using official Google SDK...');

    try {
      // Add generation config with proper settings
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      };

      const safetySettings = [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ];

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });

      const response = await result.response;
      const text = response.text();

      console.log('Gemini AI response received successfully');
      return text;
    } catch (error) {
      console.error('Gemini AI SDK error:', error);

      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes('API_KEY') || error.message.includes('403')) {
          throw new Error('Gemini API key authentication failed. Check API key and permissions. Please update API key restrictions in Google Cloud Console to allow requests from your application.');
        }
        if (error.message.includes('quota')) {
          throw new Error('Gemini API quota exceeded');
        }
        if (error.message.includes('referer') || error.message.includes('referrer')) {
          throw new Error('API key is restricted by HTTP referrer. Please update API key settings in Google Cloud Console to allow requests from localhost or remove referrer restrictions.');
        }
        throw new Error(`Gemini AI error: ${error.message}`);
      }

      throw new Error('Unknown Gemini AI error');
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
      console.error('Failed to parse translation response:', error);
      console.error('Raw response:', response);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }
}

// ========================================
// Singleton Instance
// ========================================

/**
 * Global translation service instance
 */
export const translationService = new TranslationService();

// ========================================
// Utility Functions
// ========================================

/**
 * Format Hebrew date to English readable format
 */
export function formatHebrewDateToEnglish(hebrewDate: string): string {
  // This is a simplified version - in production you'd use a proper Hebrew date library
  // For now, return as is and let AI handle the translation
  return hebrewDate;
}

/**
 * Format Gregorian date to English readable format
 */
export function formatGregorianDateToEnglish(date: string): string {
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return date;
  }
}

/**
 * Validate translated content structure
 */
export function validateTranslatedContent(data: any): data is TranslatedContent {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  // Check if at least one section exists
  const hasWeddingInfo = data.wedding_info && typeof data.wedding_info === 'object';
  const hasGroomInfo = data.groom_info && typeof data.groom_info === 'object';
  const hasBrideInfo = data.bride_info && typeof data.bride_info === 'object';
  const hasContactInfo = data.contact_info && typeof data.contact_info === 'object';
  const hasFamilyInfo = data.family_info && typeof data.family_info === 'object';

  return hasWeddingInfo || hasGroomInfo || hasBrideInfo || hasContactInfo || hasFamilyInfo;
}