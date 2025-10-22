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
    <div className="flex h-full flex-col border-e border-slate-200 bg-white shadow-sm">
      <div className={cn(
        "p-6 border-b border-slate-100",
        locale === 'he' ? 'text-end' : 'text-start'
      )}>
        <h2 className="text-lg font-bold text-slate-900">{t('dashboard')}</h2>
        <p className="text-xs text-slate-600 mt-1">תפריט ניווט</p>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link href={item.href}>
                <Button
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full gap-3 transition-all duration-200',
                    isActive(item.href) && 'bg-blue-50 text-blue-700 font-semibold border border-blue-100 shadow-sm',
                    !isActive(item.href) && 'text-slate-700 hover:bg-slate-50',
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
                  'mt-1 flex flex-col gap-1 bg-slate-50/50 rounded-lg p-2',
                  locale === 'he' ? 'me-2 border-e-2 border-blue-200 pe-3' : 'ms-2 border-s-2 border-blue-200 ps-3'
                )}>
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href}>
                      <Button
                        variant={isActive(child.href) ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn(
                          'w-full gap-2',
                          isActive(child.href) && 'bg-blue-100 text-blue-700 font-semibold',
                          !isActive(child.href) && 'text-slate-600 hover:bg-white hover:text-slate-900',
                          locale === 'he' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {child.icon}
                        <span className={cn(
                          'flex-1',
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
      <div className="border-t border-slate-200 p-4 bg-slate-50/50">
        <p className="text-xs text-slate-600 text-center font-medium">
          {locale === 'he' ? 'מערכת תמיכה למשפחות © 2025' : 'Family Support System © 2025'}
        </p>
      </div>
    </div>
  );
}
