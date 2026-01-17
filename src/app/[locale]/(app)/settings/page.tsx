/**
 * Settings Page
 * דף הגדרות המערכת עם Tabs
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק layout של דף הגדרות
 * - Open/Closed: ניתן להוסיף טאבים נוספים
 *
 * עיצוב: לפי DESIGN_SYSTEM.md
 */

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Users } from 'lucide-react';
import { UsersTab } from './_components/UsersTab';
import { EmailSettingsCard } from './_components/EmailSettingsCard';
import { MasavSettingsCard } from './_components/MasavSettingsCard';
import { MonthlyCapSettingsCard } from './_components/MonthlyCapSettingsCard';
import { WelcomeCardSettingsCard } from './_components/WelcomeCardSettingsCard';
import { TranslationSettingsCard } from './_components/TranslationSettingsCard';
import packageJson from '../../../../../package.json';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t('settings.title'),
    description: t('settings.description'),
  };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {t('settings.title')}
            </h1>
            <p className="text-muted-foreground">
                {t('settings.description')}
                <span className="mr-2 text-xs opacity-60">v{packageJson.version}</span>
              </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid border-2 shadow-sm">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.tabs.general')}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.tabs.users')}</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WelcomeCardSettingsCard />
            <MonthlyCapSettingsCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmailSettingsCard />
            <TranslationSettingsCard />
          </div>
          <MasavSettingsCard />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="rounded-lg border-2 bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1">{t('users.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('users.description')}</p>
            </div>
            <UsersTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
