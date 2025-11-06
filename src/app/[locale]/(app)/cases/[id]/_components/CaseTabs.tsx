'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Globe,
  Paperclip,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CaseWithRelations, CaseType } from '@/types/case.types';

// Import tab components
import { OriginalRequestTab } from './OriginalRequestTab';
import { FilesTab } from './FilesTab';
import { PaymentsTab } from './PaymentsTab';
import { EnglishTab } from './EnglishTab';

interface CaseTabsProps {
  caseData: CaseWithRelations;
}

/**
 * Tab IDs for different case types
 */
const WEDDING_TABS = ['originalRequest', 'english', 'files', 'payments'] as const;
const CLEANING_TABS = ['originalRequest', 'payments'] as const;

type WeddingTabId = (typeof WEDDING_TABS)[number];
type CleaningTabId = (typeof CLEANING_TABS)[number];
type TabId = WeddingTabId | CleaningTabId;

/**
 * CaseTabs - Manages all tabs for case view
 *
 * Features:
 * - Different tabs based on case type (wedding/cleaning)
 * - URL state management (?tab=hebrew)
 * - Visual indicators (✅/⚠️/🔴) for tab completion status
 * - Lazy loading of tab content
 *
 * Version B design: Elegant & Soft
 */
export function CaseTabs({ caseData }: CaseTabsProps) {
  const t = useTranslations('case.tabs');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isWedding = caseData.case_type === CaseType.WEDDING;

  // Available tabs based on case type
  const availableTabs = isWedding ? WEDDING_TABS : CLEANING_TABS;

  // Get active tab from URL or default to first tab
  const urlTab = searchParams.get('tab') as TabId | null;
  const defaultTab = availableTabs[0];
  const activeTab = urlTab && availableTabs.includes(urlTab as any) ? urlTab : defaultTab;

  /**
   * Get count badge for files tab
   */
  const getFilesBadge = () => {
    const requiredFilesCount = 3;
    const uploadedFiles = caseData.files?.length || 0;
    return `${uploadedFiles}/${requiredFilesCount}`;
  };

  // ========================================
  // Tab Status Calculation
  // ========================================

  /**
   * Calculate completion status for each tab
   * Returns: 'complete' | 'warning' | 'error' | 'none'
   */
  const getTabStatus = (tabId: TabId): 'complete' | 'warning' | 'error' | 'none' => {
    switch (tabId) {
      case 'originalRequest':
        // Check if basic info is filled
        if (isWedding) {
          const hasGroomInfo = caseData.groom_first_name && caseData.groom_last_name;
          const hasBrideInfo = caseData.bride_first_name && caseData.bride_last_name;
          return hasGroomInfo && hasBrideInfo ? 'complete' : 'warning';
        } else {
          const hasBasicInfo = caseData.family_name && caseData.child_name;
          return hasBasicInfo ? 'complete' : 'warning';
        }

      case 'english':
        // For English tab - always show as complete since manual editing is always available
        // The English tab is designed to be always accessible and usable
        return 'complete';

      case 'files':
        // Check if required files are uploaded
        const requiredFilesCount = 3; // menu, invitation, couple_photo
        const uploadedFiles = caseData.files?.length || 0;
        if (uploadedFiles === 0) return 'error';
        if (uploadedFiles < requiredFilesCount) return 'warning';
        return 'complete';

      case 'payments':
        // Check if bank details exist
        const hasBankDetails = !!caseData.bank_details;
        const hasPayments = caseData.payments && caseData.payments.length > 0;
        if (!hasBankDetails) return 'warning';
        if (hasPayments) return 'complete';
        return 'none';

      default:
        return 'none';
    }
  };

  /**
   * Get status icon for a tab
   */
  const getStatusIcon = (status: ReturnType<typeof getTabStatus>) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-600" />;
      default:
        return null;
    }
  };

  // ========================================
  // Tab Change Handler
  // ========================================

  /**
   * Handle tab change - update URL
   */
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // ========================================
  // Render
  // ========================================

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      {/* Tabs List */}
      <TabsList className="grid w-full bg-slate-100 p-1" style={{
        gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))`
      }}>
        {/* Original Request Tab */}
        <TabsTrigger
          value="originalRequest"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <FileText className="h-4 w-4 me-2" />
          <span className="hidden sm:inline">{t('originalRequest')}</span>
          <span className="sm:hidden">{t('originalRequestShort')}</span>
          {getStatusIcon(getTabStatus('originalRequest'))}
        </TabsTrigger>

        {/* English Tab - Wedding only */}
        {isWedding && (
          <TabsTrigger
            value="english"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Globe className="h-4 w-4 me-2" />
            <span className="hidden sm:inline">{t('english')}</span>
            <span className="sm:hidden">{t('englishShort')}</span>
            {getStatusIcon(getTabStatus('english'))}
          </TabsTrigger>
        )}

        {/* Files Tab - Wedding only */}
        {isWedding && (
          <TabsTrigger
            value="files"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Paperclip className="h-4 w-4 me-2" />
            <span className="hidden sm:inline">{t('files')}</span>
            <span className="sm:hidden">{t('filesShort')}</span>
            <Badge
              variant="outline"
              className="ms-2 bg-white text-xs px-1.5 py-0.5"
            >
              {getFilesBadge()}
            </Badge>
            {getStatusIcon(getTabStatus('files'))}
          </TabsTrigger>
        )}

        {/* Payments Tab */}
        <TabsTrigger
          value="payments"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <DollarSign className="h-4 w-4 me-2" />
          <span className="hidden sm:inline">{t('payments')}</span>
          <span className="sm:hidden">{t('paymentsShort')}</span>
          {getStatusIcon(getTabStatus('payments'))}
        </TabsTrigger>
      </TabsList>

      {/* Tab Contents */}
      <div className="mt-6">
        {/* Original Request Tab Content */}
        <TabsContent value="originalRequest" className="m-0">
          <OriginalRequestTab caseData={caseData} />
        </TabsContent>

        {/* English Tab Content - Wedding only */}
        {isWedding && (
          <TabsContent value="english" className="m-0">
            <EnglishTab caseData={caseData} />
          </TabsContent>
        )}

        {/* Files Tab Content - Wedding only */}
        {isWedding && (
          <TabsContent value="files" className="m-0">
            <FilesTab caseData={caseData} />
          </TabsContent>
        )}

        {/* Payments Tab Content */}
        <TabsContent value="payments" className="m-0">
          <PaymentsTab caseData={caseData} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
