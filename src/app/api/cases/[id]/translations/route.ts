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
import { z } from 'zod';

// ========================================
// Validation Schema
// ========================================

const translationsRequestSchema = z.object({
  caseId: z.string().uuid(),
});

// ========================================
// Helper Functions
// ========================================

/**
 * Check if case exists (any authenticated user can access)
 */
async function checkCaseExists(supabase: any, caseId: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .single();

  if (error || !data) {
    throw new Error('Case not found');
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
// API Route
// ========================================

/**
 * GET /api/cases/[id]/translations
 *
 * Get existing translations for a case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Creating Supabase client...');
    const supabase = await getSupabaseClient();

    if (!supabase) {
      console.error('Supabase client is null/undefined');
      return NextResponse.json(
        { error: 'Failed to create Supabase client' },
        { status: 500 }
      );
    }

    console.log('Supabase client created successfully');

    const { id: caseId } = await params;
    console.log('Case ID:', caseId);

    // Get current user
    console.log('Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate case ID
    const { error: validationError } = translationsRequestSchema.safeParse({ caseId });
    if (validationError) {
      return NextResponse.json(
        { error: 'Invalid case ID' },
        { status: 400 }
      );
    }

    // Check case exists
    await checkCaseExists(supabase, caseId);

    // Get translations
    const translations = await getTranslations(supabase, caseId);

    return NextResponse.json({
      success: true,
      translations,
    });

  } catch (error) {
    console.error('GET translations error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('Unauthorized') ? 401 :
                      errorMessage.includes('not found') ? 404 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}