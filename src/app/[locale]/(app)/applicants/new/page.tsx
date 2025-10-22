import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, FileText, Heart } from 'lucide-react';
import Link from 'next/link';

/**
 * Internal Route: /applicants/new
 *
 * עמוד בחירה להוספת בקשה חדשה
 * מנתב למזכירה לטופס הציבורי (DRY - לא משכפל קוד)
 *
 * עקרונות:
 * - Single Responsibility - רק מנווט, לא מכיל לוגיקה
 * - DRY - משתמש בטופס הציבורי הקיים
 * - תמיכה מלאה ב-i18n
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'wedding_form' });

  return {
    title: `${t('internal_page.breadcrumb.new_application')} - ${t('internal_page.title_suffix')}`,
    description: t('internal_page.description'),
  };
}

export default async function NewApplicationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // Check authentication
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  const t = await getTranslations({ locale, namespace: 'wedding_form' });
  const tNav = await getTranslations({ locale, namespace: 'navigation' });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link
          href={`/${locale}/applicants`}
          className="hover:text-blue-600 transition-colors"
        >
          {t('internal_page.breadcrumb.applicants')}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {t('internal_page.breadcrumb.new_application')}
        </span>
      </nav>

      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          {t('internal_page.breadcrumb.new_application')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('internal_page.description')}
        </p>
      </div>

      {/* Cards for different types */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Wedding Form */}
        <Card className="relative overflow-hidden border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-50/50 to-transparent opacity-60" />

          <CardHeader className="relative">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md mb-4">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl">{tNav('wedding')}</CardTitle>
            <CardDescription>
              {t('title')}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative">
            <Button
              asChild
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
            >
              <Link href={`/${locale}/public-forms/wedding`} target="_blank">
                <FileText className="h-4 w-4 me-2" />
                {t('buttons.next')}
                <ExternalLink className="h-3 w-3 ms-2" />
              </Link>
            </Button>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              {t('internal_page.form_opens_new_window')}
            </p>
          </CardContent>
        </Card>

        {/* Cleaning Form - Coming Soon */}
        <Card className="relative overflow-hidden border-2 border-gray-100 shadow-lg opacity-60">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-50/50 to-transparent opacity-60" />

          <CardHeader className="relative">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-md mb-4">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl">{tNav('cleaning')}</CardTitle>
            <CardDescription>
              {t('internal_page.cleaning_title')}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative">
            <Button
              disabled
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 me-2" />
              {t('internal_page.cleaning_coming_soon')}
            </Button>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              {t('internal_page.cleaning_in_development')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
