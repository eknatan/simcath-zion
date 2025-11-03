import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { WeddingForm } from '@/components/features/wedding-form/WeddingForm';
import { Card } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import Image from 'next/image';

/**
 * Public Route: /public-forms/wedding
 *
 * טופס ציבורי לבקשת תמיכה בחתונה
 * נגיש לכולם ללא אימות
 *
 * עקרונות:
 * - תמיכה מלאה ב-i18n (כל טקסט דרך תרגומים)
 * - Responsive design
 * - SEO optimized
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'wedding_form' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PublicWeddingFormPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'wedding_form' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Right Side - Text (Hebrew) / Text (English) */}
            <div className="flex-1 flex justify-start">
              {locale === 'he' ? (
                <div className="text-start">
                  <h1 className="text-xl font-bold text-blue-900">
                    {t('public_page.header.system_name')}
                  </h1>
                  <p className="text-xs text-blue-600">
                    {t('public_page.header.system_subtitle')}
                  </p>
                </div>
              ) : (
                <div className="text-start">
                  <h1 className="text-xl font-bold text-blue-900">
                    {t('public_page.header.system_name')}
                  </h1>
                  <p className="text-xs text-blue-600">
                    {t('public_page.header.system_subtitle')}
                  </p>
                </div>
              )}
            </div>

            {/* Center - Logo */}
            <div className="flex-shrink-0">
              <div className="h-12 flex items-center justify-center relative w-24">
                <Image
                  src="/logo.png"
                  alt={t('public_page.header.system_name')}
                  width={250}
                  height={130}
                  className="h-12 w-auto object-contain"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(97%) contrast(91%)'
                  }}
                  priority
                />
              </div>
            </div>

            {/* Left Side - Language Switcher (Hebrew) / Language Switcher (English) */}
            <div className="flex-1 flex justify-end">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <WeddingForm isInternal={false} />

        {/* Footer Info */}
        <Card className="mt-12 p-6 border-2 border-blue-100 bg-blue-50/50">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-blue-900">
              {t('public_page.footer_info.title')}
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• {t('public_page.footer_info.privacy_note')}</p>
              <p>• {t('public_page.footer_info.usage_note')}</p>
              <p>• {t('public_page.footer_info.contact')}</p>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{t('public_page.footer.copyright', { year: new Date().getFullYear() })}</p>
          <p className="mt-1">{t('public_page.footer.description')}</p>
        </div>
      </footer>
    </div>
  );
}
