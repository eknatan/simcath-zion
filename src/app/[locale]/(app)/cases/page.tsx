import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { CasesContent } from './_components/CasesContent';
import { CasesStats } from './_components/CasesStats';
import { Case } from '@/types/case.types';

/**
 * Cases List Page - Main page for viewing all cases
 *
 * Shows statistics and filterable table of all cases (weddings & cleaning)
 */
export default async function CasesPage() {
  const t = await getTranslations('cases');
  const supabase = await createClient();

  // Fetch all cases
  const { data: allCases, error } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cases:', error);
  }

  const cases: Case[] = allCases || [];

  // Calculate statistics from fetched cases
  // Active cases: cleaning with status 'active' + weddings that are not completed/rejected
  const activeWeddings = cases.filter(
    (c) => c.case_type === 'wedding' && !['transferred', 'rejected', 'expired'].includes(c.status)
  ).length;
  const activeCleaning = cases.filter((c) => c.case_type === 'cleaning' && c.status === 'active').length;

  const stats = {
    total: cases.length,
    wedding: cases.filter((c) => c.case_type === 'wedding').length,
    cleaning: cases.filter((c) => c.case_type === 'cleaning').length,
    active: activeWeddings + activeCleaning,
    pendingTransfer: cases.filter((c) => c.status === 'pending_transfer').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          {t('pageTitle')}
        </h1>
        <p className="text-lg text-slate-600">{t('pageDescription')}</p>
      </div>

      {/* Statistics */}
      <CasesStats stats={stats} />

      {/* Cases Table with Tabs */}
      <CasesContent cases={cases} />
    </div>
  );
}
