import Link from 'next/link';
import { FileX, List } from 'lucide-react';
import { ActionButton } from '@/components/shared/ActionButton';
import { getTranslations } from 'next-intl/server';

/**
 * 404 Not Found page for cases
 */
export default async function CaseNotFound() {
  const t = await getTranslations('case.notFound');

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FileX className="h-24 w-24 text-slate-400 mb-6" />

        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          {t('title')}
        </h1>

        <p className="text-lg text-slate-600 mb-2">
          {t('description')}
        </p>

        <p className="text-sm text-slate-500 mb-8">
          {t('hint')}
        </p>

        <div className="flex gap-3">
          <ActionButton variant="primary" asChild>
            <Link href="/cases">
              <List className="h-4 w-4 me-2" />
              {t('backToCases')}
            </Link>
          </ActionButton>

          <ActionButton variant="view" asChild>
            <Link href="/dashboard">
              {t('backToDashboard')}
            </Link>
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
