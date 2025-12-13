'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import { useDashboardStats, useUpcomingWeddings } from '@/lib/hooks/useDashboard';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export function WelcomeHeader() {
  const t = useTranslations('dashboard');
  const { data: stats } = useDashboardStats();
  const { data: upcomingWeddings } = useUpcomingWeddings();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch name from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (profile?.name) {
          setUserName(profile.name);
        } else {
          // Fallback to email
          setUserName(user.email?.split('@')[0] || '');
        }
      }
    };
    fetchUserData();
  }, []);

  // Extract first name from full name
  const firstName = userName.split(' ')[0] || '';

  // Determine user greeting based on time
  const currentHour = new Date().getHours();
  let greeting = t('greeting.morning', { defaultValue: 'בוקר טוב' });
  if (currentHour >= 12 && currentHour < 17) greeting = t('greeting.afternoon', { defaultValue: 'צהריים טובים' });
  if (currentHour >= 17) greeting = t('greeting.evening', { defaultValue: 'ערב טוב' });

  // Count weddings happening today (daysUntil === 0)
  const weddingsToday = upcomingWeddings?.filter(w => w.daysUntil === 0).length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-accent border p-8 shadow-sm mb-8"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-lg text-muted-foreground font-light max-w-lg leading-relaxed">
             {t.rich('greeting.subtitle_full', {
                requests: stats?.pendingTransfers || 0,
                weddings: weddingsToday,
                bold: (chunks) => <span className="font-semibold text-primary">{chunks}</span>
              })}
             <br className="hidden md:block"/>
            {t('greeting.wishing', { defaultValue: 'שיהיה יום מבורך ומוצלח!' })}
          </p>
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
  );
}
