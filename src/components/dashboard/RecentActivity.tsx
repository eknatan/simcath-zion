'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, Users, FileText } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useRecentActivity } from '@/lib/hooks/useDashboard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

export function RecentActivity() {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const { data: activities, isLoading, error } = useRecentActivity();

  const getActivityIcon = (caseType: string) => {
    switch (caseType) {
      case 'wedding':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'cleaning':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: locale === 'he' ? he : enUS,
      });
    } catch {
      return '';
    }
  };

  return (
    <Card className="border-slate-200 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-500" />
          {t('recentActivity.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {t('recentActivity.error', { defaultValue: 'שגיאה בטעינת הפעילות' })}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>{t('recentActivity.noActivity')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 8).map((activity) => (
              <Link
                key={activity.id}
                href={`/cases/${activity.caseId}`}
                className="block"
              >
                <div className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-all',
                  'hover:shadow-sm hover:bg-slate-50'
                )}>
                  <div className="mt-0.5">
                    {getActivityIcon(activity.caseType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-900">
                        {activity.action}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.caseName}
                      </Badge>
                    </div>
                    {activity.description && (
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
