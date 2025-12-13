'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Heart, Banknote, FileText, AlertTriangle } from 'lucide-react';
import { useDashboardStats, useUpcomingWeddings, useDashboardAlerts } from '@/lib/hooks/useDashboard';
import { useUserPreferences } from '@/lib/hooks/useUserPreferences';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useMemo } from 'react';
import { HDate } from '@hebcal/core';
import { formatHebrewDateForDisplay } from '@/lib/utils/hebrew-date-parser';
import { WelcomeCardSettingsPopover } from './WelcomeCardSettings';

export function WelcomeHeader() {
  const t = useTranslations('dashboard');
  const { data: stats } = useDashboardStats();
  const { data: upcomingWeddings } = useUpcomingWeddings();
  const { data: alerts } = useDashboardAlerts();
  const { preferences, isLoading: preferencesLoading } = useUserPreferences();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (profile?.name) {
          setUserName(profile.name);
        } else {
          setUserName(user.email?.split('@')[0] || '');
        }
      }
    };
    fetchUserData();
  }, []);

  // Hebrew date in gematria
  const hebrewDate = useMemo(() => {
    const today = new HDate(new Date());
    return formatHebrewDateForDisplay(
      today.getDate(),
      today.getMonth(),
      today.getFullYear(),
      'he'
    );
  }, []);

  // Extract first name from full name
  const firstName = userName.split(' ')[0] || '';

  // Determine user greeting based on time
  const currentHour = new Date().getHours();
  let greeting = t('greeting.morning', { defaultValue: 'בוקר טוב' }); // Default to morning (5-12)
  
  if (currentHour >= 12 && currentHour < 17) greeting = t('greeting.afternoon', { defaultValue: 'צהריים טובים' });
  else if (currentHour >= 17 || currentHour < 24) greeting = t('greeting.evening', { defaultValue: 'ערב טוב' });
  
  if (currentHour >= 0 && currentHour < 5) greeting = t('greeting.night', { defaultValue: 'לילה טוב' });

  // Count weddings happening today (daysUntil === 0)
  const weddingsToday = upcomingWeddings?.filter(w => w.daysUntil === 0).length || 0;

  // Count urgent alerts (high priority)
  const urgentAlertsCount = alerts?.filter(a => a.priority === 'high').length || 0;

  // Get preference values with defaults
  const { welcomeCard } = preferences;

  // Build status items for display
  interface StatusItem {
    key: string;
    count: number;
    label: string;
    icon: typeof Heart;
    colorClass: string;
    href: string;
  }

  const statusItems: StatusItem[] = [];

  if (welcomeCard.showWeddingsToday && weddingsToday > 0) {
    statusItems.push({
      key: 'weddings',
      count: weddingsToday,
      label: t('welcomeCard.badges.weddings'),
      icon: Heart,
      colorClass: 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200',
      href: '/calendar',
    });
  }

  if (welcomeCard.showPendingTransfers && (stats?.pendingTransfers || 0) > 0) {
    statusItems.push({
      key: 'transfers',
      count: stats?.pendingTransfers || 0,
      label: t('welcomeCard.badges.transfers'),
      icon: Banknote,
      colorClass: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
      href: '/transfers',
    });
  }

  if (welcomeCard.showPendingApplicants && (stats?.pendingApplicants || 0) > 0) {
    statusItems.push({
      key: 'applicants',
      count: stats?.pendingApplicants || 0,
      label: t('welcomeCard.badges.applicants'),
      icon: FileText,
      colorClass: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
      href: '/applicants/pending',
    });
  }

  if (welcomeCard.showUrgentAlerts && urgentAlertsCount > 0) {
    statusItems.push({
      key: 'alerts',
      count: urgentAlertsCount,
      label: t('welcomeCard.badges.alerts'),
      icon: AlertTriangle,
      colorClass: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
      href: '#alerts',
    });
  }

  const hasItems = statusItems.length > 0;

  // Don't render if card is hidden (and not loading preferences)
  if (!preferencesLoading && !welcomeCard.show) {
    return null;
  }

  return (
    <AnimatePresence>
      {welcomeCard.show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50 to-indigo-50 border p-8 shadow-sm mb-8"
        >
          {/* Hebrew Date */}
          {welcomeCard.showHebrewDate && (
            <div className="absolute top-4 start-4 text-sm text-muted-foreground font-medium z-10">
              {hebrewDate}
            </div>
          )}

          {/* Settings Button */}
          <WelcomeCardSettingsPopover />

          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
                  {greeting}, {firstName}
                </h1>
                <p className="text-base text-muted-foreground font-light">
                  {t('greeting.wishing', { defaultValue: 'שיהיה יום מבורך ומוצלח!' })}
                </p>
              </div>

              {/* Status Badges */}
              {hasItems && (
                <div className="flex flex-wrap gap-2">
                  {statusItems.map((item) => {
                    const IconComponent = item.icon;
                    const isUrgent = item.key === 'alerts';
                    
                    return (
                      <Link key={item.key} href={item.href}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          animate={isUrgent ? { 
                            scale: [1, 1.02, 1],
                            boxShadow: ["0px 0px 0px rgba(239, 68, 68, 0)", "0px 0px 8px rgba(239, 68, 68, 0.3)", "0px 0px 0px rgba(239, 68, 68, 0)"] 
                          } : {}}
                          transition={isUrgent ? { 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeInOut" 
                          } : { duration: 0.2 }}
                        >
                          <Badge
                            variant="outline"
                            className={`px-3 py-1.5 text-sm font-medium border cursor-pointer transition-colors shadow-sm ${item.colorClass}`}
                          >
                            <IconComponent className={`w-4 h-4 me-1.5 ${isUrgent ? 'text-red-600' : ''}`} />
                            <span className="font-bold">{item.count}</span>
                            <span className="me-1">{item.label}</span>
                          </Badge>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {!hasItems && (
                <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 border-green-200">
                  {t('welcomeCard.info.allClear')}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/applicants/pending">
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all px-6">
                  <Plus className="w-5 h-5 me-2" />
                  {t('quickActions.newCase', { defaultValue: 'בקשה חדשה' })}
                </Button>
              </Link>
              <Link href="/calendar">
                <Button size="lg" variant="outline" className="rounded-full border-2 hover:bg-accent/50 backdrop-blur-sm px-6">
                  <Calendar className="w-5 h-5 me-2" />
                  {t('quickActions.calendar', { defaultValue: 'לוח שנה' })}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
