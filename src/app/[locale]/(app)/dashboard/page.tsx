import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import {
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  Target,
} from 'lucide-react';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-lg text-slate-600">
          {t('description')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('stats.totalCases')}
          value={248}
          description="תיקים רשומים במערכת"
          icon={FileText}
          colorScheme="blue"
          trend={{
            value: '+12%',
            label: 'מהחודש שעבר',
            icon: TrendingUp,
          }}
        />

        <StatCard
          title={t('stats.active')}
          value={156}
          description="תיקים פעילים כרגע"
          icon={CheckCircle2}
          colorScheme="emerald"
          trend={{
            value: '62.9%',
            label: 'מהתיקים',
            icon: Award,
          }}
        />

        <StatCard
          title={t('stats.pending')}
          value={67}
          description="ממתינים לטיפול"
          icon={Clock}
          colorScheme="orange"
          trend={{
            value: 'דורש',
            label: 'תשומת לב',
            icon: AlertCircle,
          }}
        />

        <StatCard
          title={t('stats.transferred')}
          value="₪2.4M"
          description="סכום מועבר השנה"
          icon={DollarSign}
          colorScheme="indigo"
          trend={{
            value: '85%',
            label: 'מהיעד השנתי',
            icon: Target,
          }}
        />
      </div>

      {/* Recent Activity */}
      <Card className="border border-slate-200 shadow-md">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-xl font-bold text-slate-900">
            {t('recentActivity.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 font-medium">
              {t('recentActivity.noActivity')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              פעילות אחרונה תופיע כאן
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
