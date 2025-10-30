import Link from 'next/link';
import { FileX, List } from 'lucide-react';
import { ActionButton } from '@/components/shared/ActionButton';

/**
 * 404 Not Found page for cases
 */
export default function CaseNotFound() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FileX className="h-24 w-24 text-slate-400 mb-6" />

        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          תיק לא נמצא
        </h1>

        <p className="text-lg text-slate-600 mb-2">
          התיק שחיפשת אינו קיים או שאין לך הרשאות לצפות בו
        </p>

        <p className="text-sm text-slate-500 mb-8">
          ייתכן שהתיק נמחק או שהקישור אינו נכון
        </p>

        <div className="flex gap-3">
          <ActionButton variant="primary" asChild>
            <Link href="/cases">
              <List className="h-4 w-4 me-2" />
              לרשימת התיקים
            </Link>
          </ActionButton>

          <ActionButton variant="view" asChild>
            <Link href="/dashboard">
              חזור לדשבורד
            </Link>
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
