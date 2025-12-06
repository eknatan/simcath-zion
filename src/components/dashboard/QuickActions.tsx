'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FileText,
  Mail,
  Download,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function QuickActions() {
  const t = useTranslations('dashboard');

  const actions = [
    {
      id: 'new-case',
      icon: Plus,
      label: t('quickActions.newCase', { defaultValue: 'פתח תיק חדש' }),
      href: '/applicants/pending',
    },
    {
      id: 'view-cases',
      icon: FileText,
      label: t('quickActions.viewCases', { defaultValue: 'צפה בתיקים' }),
      href: '/cases',
    },
    {
      id: 'send-emails',
      icon: Mail,
      label: t('quickActions.sendEmails', { defaultValue: 'שלח מיילים' }),
      href: '/cases?tab=cleaning',
    },
    {
      id: 'export-masav',
      icon: Download,
      label: t('quickActions.exportMasav', { defaultValue: 'ייצא MASAV' }),
      href: '/transfers',
    },
  ];

  return (
    <Card className="border-slate-200 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          {t('quickActions.title', { defaultValue: 'פעולות מהירות' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Link key={action.id} href={action.href}>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
