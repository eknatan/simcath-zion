import { redirect as nextRedirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  const validLocale = routing.locales.includes(locale as 'he' | 'en') ? locale : routing.defaultLocale;

  // Redirect to login page
  nextRedirect(`/${validLocale}/login`);
}
