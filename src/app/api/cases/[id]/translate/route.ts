import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// יצירת קליינט עם סנכרון כדי למנוע בעיות אסינכרוניות
let supabaseClientCache: any = null;

async function getSupabaseClient() {
  try {
    if (supabaseClientCache) {
      return supabaseClientCache;
    }

    supabaseClientCache = await createClient();
    return supabaseClientCache;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}
import { translationService, TranslationRequest } from '@/lib/services/translation.service';
import { TranslatedContent } from '@/types/case.types';
import { CaseType } from '@/types/case.types';
import { z } from 'zod';

// ========================================
// Validation Schemas
// ========================================

const translateRequestSchema = z.object({
  caseId: z.string().uuid(),
});

const updateTranslationSchema = z.object({
  content: z.record(z.string(), z.any()),
});

// ========================================
// Helper Functions
// ========================================

/**
 * Get case data from database
 */
async function getCaseData(supabase: any, caseId: string) {
  const { data: caseData, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch case: ${error.message}`);
  }

  return caseData;
}

/**
 * Check if user has permission to access this case
 */
async function checkCasePermission(supabase: any, caseId: string, userId: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .eq('created_by', userId)
    .single();

  if (error || !data) {
    throw new Error('Unauthorized: You do not have permission to access this case');
  }

  return data;
}

/**
 * Prepare Hebrew data for translation
 */
function prepareHebrewData(caseData: any, caseType: CaseType) {
  if (caseType === CaseType.WEDDING) {
    return {
      wedding_date_hebrew: caseData.wedding_date_hebrew,
      wedding_date_gregorian: caseData.wedding_date_gregorian,
      city: caseData.city,
      venue: caseData.venue,
      guests_count: caseData.guests_count,
      total_cost: caseData.total_cost,
      request_background: caseData.request_background,
      groom_first_name: caseData.groom_first_name,
      groom_last_name: caseData.groom_last_name,
      groom_id: caseData.groom_id,
      groom_school: caseData.groom_school,
      groom_father_name: caseData.groom_father_name,
      groom_mother_name: caseData.groom_mother_name,
      groom_memorial_day: caseData.groom_memorial_day,
      bride_first_name: caseData.bride_first_name,
      bride_last_name: caseData.bride_last_name,
      bride_id: caseData.bride_id,
      bride_school: caseData.bride_school,
      bride_father_name: caseData.bride_father_name,
      bride_mother_name: caseData.bride_mother_name,
      bride_memorial_day: caseData.bride_memorial_day,
      address: caseData.address,
      contact_phone: caseData.contact_phone,
      contact_email: caseData.contact_email,
    };
  } else {
    // Cleaning case
    return {
      family_name: caseData.family_name,
      child_name: caseData.child_name,
      parent1_name: caseData.parent1_name,
      parent1_id: caseData.parent1_id,
      parent2_name: caseData.parent2_name,
      parent2_id: caseData.parent2_id,
      address: caseData.address,
      city: caseData.city,
      contact_phone: caseData.contact_phone,
      contact_phone2: caseData.contact_phone2,
      contact_phone3: caseData.contact_phone3,
      contact_email: caseData.contact_email,
      start_date: caseData.start_date,
    };
  }
}

/**
 * Save translation to database
 */
async function saveTranslation(
  supabase: any,
  caseId: string,
  content: TranslatedContent,
  userId: string,
  editedByUser: boolean = false
) {
  console.log('Saving translation with data:', {
      case_id: caseId,
      lang_from: 'he',
      lang_to: 'en',
      edited_by_user: editedByUser,
      translated_by: userId,
      content_keys: Object.keys(content)
    });

    const { data, error } = await supabase
    .from('translations')
    .upsert({
      case_id: caseId,
      lang_from: 'he',
      lang_to: 'en',
      content_json: content,
      edited_by_user: editedByUser,
      translated_by: userId,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'case_id,lang_to',
      returning: '*'
    })
    .select()
    .single();

    console.log('Upsert result:', { data: data ? 'success' : 'null', error: error ? error.message : 'none' });

  if (error) {
    throw new Error(`Failed to save translation: ${error.message}`);
  }

  return data;
}

/**
 * Get existing translations for a case
 */
async function getTranslations(supabase: any, caseId: string) {
  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch translations: ${error.message}`);
  }

  return data || [];
}

// ========================================
// API Routes
// ========================================

/**
 * GET /api/cases/[id]/translate
 *
 * Get existing translations for a case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('GET translate - Creating Supabase client...');
    const supabase = await getSupabaseClient();

    if (!supabase) {
      console.error('GET translate - Supabase client is null/undefined');
      return NextResponse.json(
        { error: 'Failed to create Supabase client' },
        { status: 500 }
      );
    }

    const { id: caseId } = await params;
    console.log('GET translate - Case ID:', caseId);

    // Get current user
    console.log('GET translate - Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate case ID
    const { error: validationError } = translateRequestSchema.safeParse({ caseId });
    if (validationError) {
      return NextResponse.json(
        { error: 'Invalid case ID' },
        { status: 400 }
      );
    }

    // Check permissions
    await checkCasePermission(supabase, caseId, user.id);

    // Get translations
    const translations = await getTranslations(supabase, caseId);

    return NextResponse.json({
      success: true,
      translations,
    });

  } catch (error) {
    console.error('GET translation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('Unauthorized') ? 401 :
                      errorMessage.includes('not found') ? 404 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/cases/[id]/translate
 *
 * Translate a case from Hebrew to English using AI
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('POST translate - Creating Supabase client...');
    const supabase = await getSupabaseClient();

    if (!supabase) {
      console.error('POST translate - Supabase client is null/undefined');
      return NextResponse.json(
        { error: 'Failed to create Supabase client' },
        { status: 500 }
      );
    }

    const { id: caseId } = await params;
    console.log('POST translate - Case ID:', caseId);

    // Get current user
    console.log('POST translate - Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate case ID
    const { error: validationError } = translateRequestSchema.safeParse({ caseId });
    if (validationError) {
      return NextResponse.json(
        { error: 'Invalid case ID' },
        { status: 400 }
      );
    }

    // Check permissions
    await checkCasePermission(supabase, caseId, user.id);

    // Get case data
    const caseData = await getCaseData(supabase, caseId);
    const caseType = caseData.case_type as CaseType;

    // Prepare Hebrew data for translation
    const hebrewData = prepareHebrewData(caseData, caseType);

    // Call translation service
    const translationRequest: TranslationRequest = {
      caseType,
      hebrewData,
    };

    const translationResult = await translationService.translateCase(translationRequest);

    if (!translationResult.success || !translationResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: translationResult.error || 'Translation failed',
        },
        { status: 500 }
      );
    }

    // Save translation to database
    const savedTranslation = await saveTranslation(
      supabase,
      caseId,
      translationResult.data,
      user.id,
      false // Not edited by user - this is AI translation
    );

    return NextResponse.json({
      success: true,
      data: translationResult.data,
      translation: savedTranslation,
    });

  } catch (error) {
    console.error('POST translation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('Unauthorized') ? 401 :
                      errorMessage.includes('not found') ? 404 :
                      errorMessage.includes('API') ? 502 : 500;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/cases/[id]/translate
 *
 * Update an existing translation with manual edits
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('PUT translate - Creating Supabase client...');
    const supabase = await getSupabaseClient();

    if (!supabase) {
      console.error('PUT translate - Supabase client is null/undefined');
      return NextResponse.json(
        { error: 'Failed to create Supabase client' },
        { status: 500 }
      );
    }

    const { id: caseId } = await params;
    console.log('PUT translate - Case ID:', caseId);

    // Get current user
    console.log('PUT translate - Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { error: validationError } = updateTranslationSchema.safeParse(body);
    if (validationError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { content } = body;

    // Validate case ID
    const { error: caseIdValidationError } = translateRequestSchema.safeParse({ caseId });
    if (caseIdValidationError) {
      return NextResponse.json(
        { error: 'Invalid case ID' },
        { status: 400 }
      );
    }

    // Check permissions
    await checkCasePermission(supabase, caseId, user.id);

    // Validate content structure
    if (!content || typeof content !== 'object') {
      return NextResponse.json(
        { error: 'Invalid translation content' },
        { status: 400 }
      );
    }

    // Save updated translation
    const savedTranslation = await saveTranslation(
      supabase,
      caseId,
      content as TranslatedContent,
      user.id,
      true // Mark as edited by user
    );

    return NextResponse.json({
      success: true,
      data: savedTranslation,
    });

  } catch (error) {
    console.error('PUT translation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('Unauthorized') ? 401 :
                      errorMessage.includes('not found') ? 404 : 500;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}