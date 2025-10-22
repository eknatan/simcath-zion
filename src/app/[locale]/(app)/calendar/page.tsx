import HebrewCalendar from '@/components/calendar/HebrewCalendar';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export default async function CalendarPage() {
  const t = await getTranslations('calendar');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('subtitle')}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {t('backToDashboard')}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <HebrewCalendar language="he" showBothLanguages={true} />
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <p>{t('footer.title')}</p>
        <p className="mt-1">{t('footer.subtitle')}</p>
      </footer>
    </div>
  );
}
