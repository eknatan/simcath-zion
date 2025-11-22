import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CaseWithRelations } from '@/types/case.types';
import { CaseView } from './_components/CaseView';

/**
 * Case Management Page (Server Component)
 *
 * Loads case data with all relations and passes to client component.
 * Handles 404 and permission errors.
 *
 * @param params - Route params containing case ID
 */
export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const supabase = await createClient();

  // ========================================
  // Fetch case data with all relations
  // ========================================
  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .select(
      `
      *,
      bank_details(*),
      files(*),
      payments(*),
      translations(*)
    `
    )
    .eq('id', id)
    .single();

  // ========================================
  // Error handling
  // ========================================

  // Case not found
  if (caseError || !caseData) {
    notFound();
  }

  // ========================================
  // Fetch case history separately (optional - can be loaded on demand)
  // ========================================
  const { data: historyData } = await supabase
    .from('case_history')
    .select(
      `
      *,
      profiles!case_history_changed_by_profiles_fkey(name)
    `
    )
    .eq('case_id', id)
    .order('changed_at', { ascending: false })
    .limit(50);

  // Combine data - map profiles.name to changed_by_name for history entries
  const caseWithRelations: CaseWithRelations = {
    ...caseData,
    history: (historyData || []).map((entry: any) => ({
      ...entry,
      changed_by_name: entry.profiles?.name || null,
    })),
  };

  // ========================================
  // Render
  // ========================================
  return (
    <div className="container mx-auto py-6 px-4">
      <CaseView initialData={caseWithRelations} locale={locale} />
    </div>
  );
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: caseData } = await supabase
    .from('cases')
    .select('case_number, case_type, groom_first_name, bride_first_name, family_name')
    .eq('id', id)
    .single();

  if (!caseData) {
    return {
      title: 'Case Not Found',
    };
  }

  // Generate title based on case type
  let title = `Case #${caseData.case_number}`;

  if (caseData.case_type === 'wedding') {
    const groomName = caseData.groom_first_name || '';
    const brideName = caseData.bride_first_name || '';
    if (groomName || brideName) {
      title = `${groomName} & ${brideName} - Case #${caseData.case_number}`;
    }
  } else if (caseData.case_type === 'cleaning') {
    const familyName = caseData.family_name || '';
    if (familyName) {
      title = `${familyName} - Case #${caseData.case_number}`;
    }
  }

  return {
    title,
    description: `Case management for ${caseData.case_type} case #${caseData.case_number}`,
  };
}
