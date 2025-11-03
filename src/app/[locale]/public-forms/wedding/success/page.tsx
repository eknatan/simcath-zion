import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Heart, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * Success Page: /public-forms/wedding/success
 *
 * דף הצלחה אחרי שליחת טופס חתונה
 * מציג הודעת אישור למשתמש
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'wedding_form' });

  return {
    title: t('success.title'),
    description: t('success.message'),
  };
}

export default async function WeddingSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'wedding_form' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-green-200 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Success Icon */}
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>

          {/* Title */}
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            {t('success.title')}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          {/* Message */}
          <p className="text-lg text-muted-foreground">
            {t('success.message')}
          </p>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <Heart className="h-6 w-6 text-green-500 bg-white px-2" />
            </div>
          </div>

          {/* Next Steps */}
          <Card className="bg-green-50/50 border-green-200">
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-green-900">
                {t('public_page.footer_info.title')}
              </h3>
              <div className="text-sm text-green-700 space-y-2">
                <p>• {t('public_page.footer_info.usage_note')}</p>
                <p>• {t('public_page.footer_info.contact')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              asChild
              variant="outline"
              className="flex-1 border-2"
            >
              <Link href="/">
                <Home className="h-4 w-4 me-2" />
                {t('public_page.header.system_name')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
