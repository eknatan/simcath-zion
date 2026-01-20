import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { CasesContent } from './_components/CasesContent';
import { CasesStats } from './_components/CasesStats';
import { CaseForTable, REQUIRED_WEDDING_FILES } from '@/types/case.types';

/**
 * Cases List Page - Main page for viewing all cases
 *
 * Shows statistics and filterable table of all cases (weddings & cleaning)
 */
export default async function CasesPage() {
  const t = await getTranslations('cases');
  const supabase = await createClient();

  // Fetch all cases with relations (bank_details, payments, files)
  const { data: allCases, error } = await supabase
    .from('cases')
    .select(`
      *,
      bank_details (id),
      payments (amount_ils, payment_type, status),
      files (file_type)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cases:', error);
  }

  // Transform cases to include computed fields
  const cases: CaseForTable[] = (allCases || []).map((c: any) => {
    // Check if has bank details
    const has_bank_details = Array.isArray(c.bank_details)
      ? c.bank_details.length > 0
      : !!c.bank_details;

    // Get approved amount from wedding_transfer payment (approved or transferred status)
    const weddingPayment = Array.isArray(c.payments)
      ? c.payments.find((p: any) =>
          p.payment_type === 'wedding_transfer' &&
          (p.status === 'approved' || p.status === 'transferred')
        )
      : null;
    const approved_amount = weddingPayment?.amount_ils || null;

    // Count files and required files
    const files = Array.isArray(c.files) ? c.files : [];
    const files_count = files.length;
    const requiredFileTypes = REQUIRED_WEDDING_FILES as string[];
    const required_files_count = files.filter((f: any) =>
      requiredFileTypes.includes(f.file_type)
    ).length;

    // Remove nested relations from the case object (destructure to exclude)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { bank_details: _bd, payments: _pay, files: _files, ...caseData } = c;

    return {
      ...caseData,
      has_bank_details,
      approved_amount,
      files_count,
      required_files_count,
    };
  });

  // Calculate statistics from fetched cases
  // Active cases: cleaning with status 'active' + weddings that are not completed/rejected
  const activeWeddings = cases.filter(
    (c) => c.case_type === 'wedding' && !['transferred', 'rejected', 'expired'].includes(c.status)
  ).length;
  const activeCleaning = cases.filter((c) => c.case_type === 'cleaning' && c.status === 'active').length;

  const stats = {
    total: cases.length,
    wedding: activeWeddings,
    cleaning: activeCleaning,
    active: activeWeddings + activeCleaning,
    pendingTransfer: cases.filter((c) => c.status === 'pending_transfer').length,
  };

  return (
    <div className="space-y-4">
      {/* Page Header - inline */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('pageTitle')}
        </h1>
        <p className="text-sm text-slate-500">{t('pageDescription')}</p>
      </div>

      {/* Statistics */}
      <CasesStats stats={stats} />

      {/* Cases Table with Tabs */}
      <CasesContent cases={cases} />
    </div>
  );
}
