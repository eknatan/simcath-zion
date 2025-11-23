'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useUpcomingWeddings } from '@/lib/hooks/useDashboard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';

export function UpcomingWeddings() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const isRTL = locale === 'he';

  const { data: weddings, isLoading, error } = useUpcomingWeddings();

  return (
    <Card className="border-slate-200 shadow-md h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            {t('upcomingWeddings.title', { defaultValue: 'חתונות קרובות' })}
          </CardTitle>
          <Link href="/cases">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              {t('upcomingWeddings.viewAll', { defaultValue: 'כל התיקים' })}
              {isRTL ? <ChevronLeft className="h-4 w-4 ms-1" /> : <ChevronRight className="h-4 w-4 ms-1" />}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {t('upcomingWeddings.error', { defaultValue: 'שגיאה בטעינת הנתונים' })}
          </div>
        ) : !weddings || weddings.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Heart className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>{t('upcomingWeddings.noWeddings', { defaultValue: 'אין חתונות ב-7 הימים הקרובים' })}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weddings.slice(0, 5).map((wedding) => (
              <Link
                key={wedding.id}
                href={`/cases/${wedding.id}`}
                className="block"
              >
                <div className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-all',
                  'hover:shadow-md hover:border-pink-200 hover:bg-pink-50/50',
                  wedding.daysUntil <= 1 && 'border-pink-300 bg-pink-50'
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {wedding.coupleName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        #{wedding.case_number}
                      </Badge>
                    </div>
                    {wedding.city && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {wedding.city}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      className={cn(
                        'text-xs',
                        wedding.daysUntil === 0 && 'bg-pink-500',
                        wedding.daysUntil === 1 && 'bg-orange-500',
                        wedding.daysUntil > 1 && 'bg-blue-500'
                      )}
                    >
                      <Clock className="h-3 w-3 me-1" />
                      {wedding.daysUntil === 0
                        ? t('upcomingWeddings.today', { defaultValue: 'היום!' })
                        : wedding.daysUntil === 1
                          ? t('upcomingWeddings.tomorrow', { defaultValue: 'מחר' })
                          : t('upcomingWeddings.inDays', { days: wedding.daysUntil, defaultValue: `בעוד ${wedding.daysUntil} ימים` })}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(wedding.wedding_date_gregorian).toLocaleDateString(
                        locale === 'he' ? 'he-IL' : 'en-US',
                        { day: 'numeric', month: 'short' }
                      )}
                    </span>
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
