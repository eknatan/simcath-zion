import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, FileText, Users, DollarSign } from 'lucide-react';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');

  const stats = [
    {
      title: t('stats.totalCases'),
      value: '0',
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: t('stats.pending'),
      value: '0',
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: t('stats.active'),
      value: '0',
      icon: <LayoutDashboard className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: t('stats.transferred'),
      value: '0',
      icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivity.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('recentActivity.noActivity')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
