'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useDashboardAlerts } from '@/lib/hooks/useDashboard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';

export function AlertsWidget() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const isRTL = locale === 'he';

  const { data: alerts, isLoading, error } = useDashboardAlerts();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card className="border-slate-200 shadow-md h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {t('alerts.title', { defaultValue: 'דורש תשומת לב' })}
            {alerts && alerts.length > 0 && (
              <Badge variant="destructive" className="ms-2">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {t('alerts.error', { defaultValue: 'שגיאה בטעינת ההתראות' })}
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
            <p className="text-green-600 font-medium">
              {t('alerts.noAlerts', { defaultValue: 'אין התראות - הכל תקין!' })}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <Link
                key={alert.id}
                href={alert.caseId ? `/cases/${alert.caseId}` : alert.applicantId ? '/applicants/pending' : '#'}
                className="block"
              >
                <div className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-all',
                  'hover:shadow-md hover:bg-slate-50',
                  alert.priority === 'high' && 'border-red-200 bg-red-50/50',
                  alert.priority === 'medium' && 'border-orange-200 bg-orange-50/50'
                )}>
                  {getPriorityIcon(alert.priority)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-900">
                        {alert.title}
                      </span>
                    </div>
                    {alert.description && (
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {alert.description}
                      </p>
                    )}
                  </div>
                  {isRTL ? (
                    <ChevronLeft className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
