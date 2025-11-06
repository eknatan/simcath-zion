'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect } from 'react';
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
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import Loading component
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

// Dynamic imports for tab components - code splitting for better performance
const OriginalRequestTab = dynamic(() => import('./OriginalRequestTab').then(mod => ({ default: mod.OriginalRequestTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

const FilesTab = dynamic(() => import('./FilesTab').then(mod => ({ default: mod.FilesTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

const PaymentsTab = dynamic(() => import('./PaymentsTab').then(mod => ({ default: mod.PaymentsTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

const EnglishTab = dynamic(() => import('./EnglishTab').then(mod => ({ default: mod.EnglishTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

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
 * - Full keyboard navigation support
 * - Accessibility compliance
 *
 * Version B design: Elegant & Soft
 */
export function CaseTabs({ caseData }: CaseTabsProps) {
  const t = useTranslations('case.tabs');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isWedding = caseData.case_type === CaseType.WEDDING;

  // Keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Ctrl/Cmd + number keys for tab navigation
      if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '9') {
        const tabIndex = parseInt(event.key) - 1;
        if (tabIndex < availableTabs.length) {
          const tabId = availableTabs[tabIndex];
          handleTabChange(tabId);
          event.preventDefault();
        }
      }

      // Handle arrow key navigation between tabs
      if (event.target && event.target.getAttribute('role') === 'tab') {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]:not([disabled])'));
        const currentIndex = tabs.indexOf(event.target as Element);

        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          let nextIndex;
          if (isRTL()) {
            // In RTL, right arrow goes to previous, left arrow goes to next
            nextIndex = event.key === 'ArrowLeft'
              ? (currentIndex + 1) % tabs.length
              : (currentIndex - 1 + tabs.length) % tabs.length;
          } else {
            // In LTR, right arrow goes to next, left arrow goes to previous
            nextIndex = event.key === 'ArrowRight'
              ? (currentIndex + 1) % tabs.length
              : (currentIndex - 1 + tabs.length) % tabs.length;
          }

          tabs[nextIndex].setAttribute('tabindex', '0');
          tabs[currentIndex].setAttribute('tabindex', '-1');
          (tabs[nextIndex] as HTMLElement).focus();
          event.preventDefault();
        }

        // Handle Home/End keys
        if (event.key === 'Home') {
          tabs[0].setAttribute('tabindex', '0');
          tabs[currentIndex].setAttribute('tabindex', '-1');
          (tabs[0] as HTMLElement).focus();
          event.preventDefault();
        } else if (event.key === 'End') {
          const lastTab = tabs[tabs.length - 1];
          lastTab.setAttribute('tabindex', '0');
          tabs[currentIndex].setAttribute('tabindex', '-1');
          (lastTab as HTMLElement).focus();
          event.preventDefault();
        }
      }
    };

    const isRTL = () => {
      return document.documentElement.getAttribute('dir') === 'rtl';
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [availableTabs]);

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
      <TabsList
        className="grid w-full bg-slate-100 p-1 gap-1 max-w-4xl mx-auto lg:max-w-none"
        style={{
          gridTemplateColumns: `repeat(${availableTabs.length}, minmax(140px, 1fr))`
        }}
      >
        {/* Original Request Tab */}
        <TabsTrigger
          value="originalRequest"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm min-w-0 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          data-tab-short={t('originalRequestShort')}
          data-tab-long={t('originalRequest')}
          aria-label={`${t('originalRequest')} tab ${getStatusIcon(getTabStatus('originalRequest')) ? '- ' + (getTabStatus('originalRequest') === 'complete' ? 'completed' : getTabStatus('originalRequest') === 'warning' ? 'needs attention' : 'has errors') : ''}`}
          tabIndex={activeTab === 'originalRequest' ? 0 : -1}
        >
          <FileText className="h-4 w-4 me-1 sm:me-2 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline truncate">{t('originalRequest')}</span>
          <span className="sm:hidden truncate">{t('originalRequestShort')}</span>
          {getStatusIcon(getTabStatus('originalRequest'))}
        </TabsTrigger>

        {/* English Tab - Wedding only */}
        {isWedding && (
          <TabsTrigger
            value="english"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm min-w-0"
            data-tab-short={t('englishShort')}
            data-tab-long={t('english')}
          >
            <Globe className="h-4 w-4 me-1 sm:me-2 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{t('english')}</span>
            <span className="sm:hidden truncate">{t('englishShort')}</span>
            {getStatusIcon(getTabStatus('english'))}
          </TabsTrigger>
        )}

        {/* Files Tab - Wedding only */}
        {isWedding && (
          <TabsTrigger
            value="files"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm min-w-0"
            data-tab-short={t('filesShort')}
            data-tab-long={t('files')}
          >
            <Paperclip className="h-4 w-4 me-1 sm:me-2 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{t('files')}</span>
            <span className="sm:hidden truncate">{t('filesShort')}</span>
            <Badge
              variant="outline"
              className="ms-1 sm:ms-2 bg-white text-xs px-1.5 py-0.5 flex-shrink-0"
            >
              {getFilesBadge()}
            </Badge>
            {getStatusIcon(getTabStatus('files'))}
          </TabsTrigger>
        )}

        {/* Payments Tab */}
        <TabsTrigger
          value="payments"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm min-w-0"
          data-tab-short={t('paymentsShort')}
          data-tab-long={t('payments')}
        >
          <DollarSign className="h-4 w-4 me-1 sm:me-2 flex-shrink-0" />
          <span className="hidden sm:inline truncate">{t('payments')}</span>
          <span className="sm:hidden truncate">{t('paymentsShort')}</span>
          {getStatusIcon(getTabStatus('payments'))}
        </TabsTrigger>
      </TabsList>

      {/* Tab Contents */}
      <div className="mt-6">
        {/* Original Request Tab Content */}
        <TabsContent value="originalRequest" className="m-0">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <OriginalRequestTab caseData={caseData} />
          </Suspense>
        </TabsContent>

        {/* English Tab Content - Wedding only */}
        {isWedding && (
          <TabsContent value="english" className="m-0">
            <Suspense fallback={<TabLoadingSkeleton />}>
              <EnglishTab caseData={caseData} />
            </Suspense>
          </TabsContent>
        )}

        {/* Files Tab Content - Wedding only */}
        {isWedding && (
          <TabsContent value="files" className="m-0">
            <Suspense fallback={<TabLoadingSkeleton />}>
              <FilesTab caseData={caseData} />
            </Suspense>
          </TabsContent>
        )}

        {/* Payments Tab Content */}
        <TabsContent value="payments" className="m-0">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <PaymentsTab caseData={caseData} />
          </Suspense>
        </TabsContent>
      </div>
    </Tabs>
  );
}
