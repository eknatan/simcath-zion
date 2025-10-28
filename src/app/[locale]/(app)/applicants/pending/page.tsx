/**
 * Page: /applicants/pending
 *
 * מסך ניהול בקשות ממתינות למזכירות
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק מציג רשימת בקשות
 * - Open/Closed: ניתן להרחבה עם פילטרים נוספים
 * - Dependency Inversion: משתמש בקומפוננטות משותפות
 *
 * מבנה המסך (לפי CASE_CREATION_SPEC.md):
 * 1. סיכום סטטיסטיקות (Cards)
 * 2. Tabs: ממתינות לאישור / נדחות
 * 3. טבלה + סינונים
 * 4. Dialogs: צפייה, אישור, דחייה
 */

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ApplicantsContent } from './_components/ApplicantsContent';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'applicants' });

  return {
    title: `${t('page_title')} - ${t('site_name')}`,
    description: t('page_description'),
  };
}

export default async function PendingApplicantsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // הדף עצמו server component
  // כל הלוגיקה של fetch data בצד הקליינט (ApplicantsContent)
  // כדי לאפשר real-time updates, filters, etc.

  return <ApplicantsContent locale={locale} />;
}
