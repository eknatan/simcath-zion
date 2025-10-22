'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Heart,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

export function Sidebar() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const locale = useLocale();

  const navItems: NavItem[] = [
    {
      title: t('dashboard'),
      href: `/${locale}/dashboard`,
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: t('cases'),
      href: `/${locale}/cases`,
      icon: <FileText className="h-5 w-5" />,
      children: [
        {
          title: t('wedding'),
          href: `/${locale}/cases/wedding`,
          icon: <Heart className="h-4 w-4" />,
        },
        {
          title: t('cleaning'),
          href: `/${locale}/cases/cleaning`,
          icon: <Users className="h-4 w-4" />,
        },
      ],
    },
    {
      title: t('calendar'),
      href: `/${locale}/calendar`,
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: t('applicants'),
      href: `/${locale}/applicants`,
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: t('transfers'),
      href: `/${locale}/transfers`,
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: t('settings'),
      href: `/${locale}/settings`,
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="flex h-full flex-col border-e bg-background">
      <div className={cn(
        "p-6",
        locale === 'he' ? 'text-end' : 'text-start'
      )}>
        <h2 className="text-lg font-semibold">{t('dashboard')}</h2>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link href={item.href}>
                <Button
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full gap-3',
                    isActive(item.href) && 'bg-secondary font-medium',
                    locale === 'he' ? 'justify-end flex-row-reverse' : 'justify-start'
                  )}
                >
                  {item.icon}
                  <span className={cn(
                    "flex-1",
                    locale === 'he' ? 'text-end' : 'text-start'
                  )}>{item.title}</span>
                  {item.children && (
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isActive(item.href) && 'rotate-90',
                        locale === 'he' && 'rotate-180'
                      )}
                    />
                  )}
                </Button>
              </Link>

              {/* Children */}
              {item.children && isActive(item.href) && (
                <div className={cn(
                  'mt-1 flex flex-col gap-1',
                  locale === 'he' ? 'me-4 border-e-2 pe-4' : 'ms-4 border-s-2 ps-4'
                )}>
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href}>
                      <Button
                        variant={isActive(child.href) ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn(
                          'w-full gap-2',
                          isActive(child.href) && 'bg-secondary font-medium',
                          locale === 'he' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {child.icon}
                        <span className={cn(
                          locale === 'he' ? 'text-end' : 'text-start'
                        )}>{child.title}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          {locale === 'he' ? 'מערכת תמיכה למשפחות © 2025' : 'Family Support System © 2025'}
        </p>
      </div>
    </div>
  );
}
