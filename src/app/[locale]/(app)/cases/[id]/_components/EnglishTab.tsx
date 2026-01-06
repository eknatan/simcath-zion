'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionButton } from '@/components/shared/ActionButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Edit3,
  RefreshCw,
  CheckCircle2,
  Globe,
  Loader2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CaseWithRelations, TranslatedContent } from '@/types/case.types';
import { useCaseTranslation } from '@/components/features/cases/hooks/useCaseTranslation';

// Import the new extracted components
import { TranslationErrorBoundary, TranslationErrorDisplay } from '@/components/features/cases/translation/TranslationErrorBoundary';
import { NotTranslatedState } from '@/components/features/cases/translation/TranslationStates/NotTranslatedState';
import { TranslatingState } from '@/components/features/cases/translation/TranslationStates/TranslatingState';
import { WeddingInfoSection } from '@/components/features/cases/translation/TranslationSections/WeddingInfoSection';
import { PersonInfoSection } from '@/components/features/cases/translation/TranslationSections/PersonInfoSection';
import { ContactInfoSection } from '@/components/features/cases/translation/TranslationSections/ContactInfoSection';

interface EnglishTabProps {
  caseData: CaseWithRelations;
}

// ========================================
// Translation States
// ========================================

type TranslationState = 'not_translated' | 'translating' | 'translated' | 'editing';

// ========================================
// English Tab Component (Refactored)
// ========================================

/**
 * EnglishTab - Manages English translation of case data
 *
 * Features:
 * - AI-powered translation from Hebrew to English
 * - 3 states: not translated, translating, translated
 * - Manual editing with autosave
 * - Retranslate with warning dialog
 * - Version B design: Elegant & Soft
 * - Refactored into smaller, focused components
 */
export function EnglishTab({ caseData }: EnglishTabProps) {
  const t = useTranslations('case.english');

  const {
    translation,
    isTranslating,
    isSaving,
    error,
    translate,
    updateTranslation,
    retranslate
  } = useCaseTranslation({ caseId: caseData.id });

  const [translationState, setTranslationState] = useState<TranslationState>(() => {
    if (isTranslating) return 'translating';
    if (translation && !translation.edited_by_user) return 'translated';
    if (translation && translation.edited_by_user) return 'editing';
    // תמיד מציג את הטופס כברירת מחדל במצב עריכה ידנית
    return 'editing';
  });

  const [editForm, setEditForm] = useState<TranslatedContent>(() => {
    if (translation?.content_json) {
      return translation.content_json as TranslatedContent;
    }
    return {};
  });

  // Sync editForm when translation data loads/updates from server
  useEffect(() => {
    if (translation?.content_json) {
      setEditForm(translation.content_json as TranslatedContent);
    }
  }, [translation?.content_json]);

  // ========================================
  // Event Handlers
  // ========================================

  const handleTranslate = async () => {
    setTranslationState('translating');
    const success = await translate();
    setTranslationState(success ? 'translated' : 'not_translated');
  };

  const handleEdit = () => {
    setTranslationState('editing');
  };

  const handleRetranslate = async () => {
    setTranslationState('translating');
    const success = await retranslate();
    if (success) {
      setTranslationState('translated');
      if (translation?.content_json) {
        setEditForm(translation.content_json as TranslatedContent);
      }
    } else {
      setTranslationState('editing');
    }
  };

  const handleSaveField = async (section: keyof TranslatedContent, field: string, value: any): Promise<boolean> => {
    const updatedForm = {
      ...editForm,
      [section]: {
        ...editForm[section],
        [field]: value
      }
    };
    setEditForm(updatedForm);
    return await updateTranslation(updatedForm);
  };

  // ========================================
  // Render Functions
  // ========================================

  const renderActionButtons = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* Auto-translate button - always available */}
      {!isTranslating && (
        translation ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <ActionButton variant="restore">
                <RefreshCw className="h-4 w-4 me-2" />
                {t('actions.retranslate')}
              </ActionButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('retranslateDialog.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('retranslateDialog.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <ActionButton variant="cancel">
                    {t('retranslateDialog.cancel')}
                  </ActionButton>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <ActionButton variant="restore-primary" onClick={handleRetranslate}>
                    {t('retranslateDialog.confirm')}
                  </ActionButton>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <ActionButton
            variant="view"
            onClick={handleTranslate}
            disabled={isTranslating}
          >
            <Globe className="h-4 w-4 me-2" />
            תרגום אוטומטי
          </ActionButton>
        )
      )}

      {/* Edit status indicator - shows we're always in manual edit mode */}
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg">
        <Edit3 className="h-4 w-4" />
        <span className="text-sm font-medium">עריכה ידנית פעילה</span>
      </div>
    </div>
  );

  const renderTranslatedContent = () => {
    const isEditing = true; // תמיד מאפשר עריכה
    const content = translation?.content_json as TranslatedContent || editForm;

    return (
      <div className="space-y-6">
        {renderActionButtons()}

        {/* Wedding Info - תמיד מוצג */}
        <Card dir="ltr" style={{ direction: 'ltr' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Globe className="h-5 w-5 text-slate-600" />
              Wedding Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeddingInfoSection
              weddingInfo={content.wedding_info || {}}
              isEditing={isEditing}
              onSaveField={handleSaveField}
            />
          </CardContent>
        </Card>

        {/* Groom Info - תמיד מוצג */}
        <PersonInfoSection
          title="Groom Information"
          personInfo={content.groom_info || {}}
          sectionKey="groom_info"
          isEditing={isEditing}
          onSaveField={handleSaveField}
        />

        {/* Bride Info - תמיד מוצג */}
        <PersonInfoSection
          title="Bride Information"
          personInfo={content.bride_info || {}}
          sectionKey="bride_info"
          isEditing={isEditing}
          onSaveField={handleSaveField}
        />

        {/* Contact Info - תמיד מוצג */}
        <ContactInfoSection
          contactInfo={content.contact_info || {}}
          isEditing={isEditing}
          onSaveField={handleSaveField}
        />

        {/* Success indicator */}
        {isSaving && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('saving')}
          </div>
        )}
      </div>
    );
  };

  // ========================================
  // Error Handling
  // ========================================

  const renderError = (errorMessage: string) => (
    <TranslationErrorDisplay
      error={errorMessage}
      onRetry={handleTranslate}
      onEditExisting={translation ? handleEdit : undefined}
      showEditButton={!!translation}
    />
  );

  // ========================================
  // Main Render
  // ========================================

  if (error) {
    return renderError(error);
  }

  return (
    <TranslationErrorBoundary
      fallback={(error) => renderError(`Unexpected error: ${error.message}. Please refresh the page.`)}
    >
      <div className="space-y-6" dir="ltr" style={{ direction: 'ltr' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-slate-600" />
              {t('title')}
            </h2>
            <p className="text-slate-600 mt-1">
              {t('subtitle')}
            </p>
          </div>

          {translation && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm text-emerald-700">
                {translation.edited_by_user ? t('status.edited') : t('status.translated')}
              </span>
            </div>
          )}
        </div>

        {/* Translation loading overlay */}
        {translationState === 'translating' && <TranslatingState />}

        {/* Translation form - always shown */}
        {renderTranslatedContent()}

        {/* Auto-translate button for convenience */}
        {!translation && !isTranslating && (
          <div className="mt-6">
            <NotTranslatedState onTranslate={handleTranslate} isTranslating={isTranslating} />
          </div>
        )}
      </div>
    </TranslationErrorBoundary>
  );
}