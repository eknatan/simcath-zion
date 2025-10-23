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
  ChevronLeft,
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
    <div className="flex h-full flex-col border-e border-slate-200 bg-gradient-to-b from-slate-50/50 to-white shadow-sm">
      <div className="p-6 border-b border-slate-100 bg-white/80">
        <h2 className="text-xl font-bold text-slate-900">{t('dashboard')}</h2>
        <p className="text-sm text-slate-600 mt-1">תפריט ניווט</p>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        <nav className="flex flex-col gap-2">
          {navItems.map((item, index) => (
            <div key={item.href}>
              {index > 0 && (
                <div className="my-2 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent shadow-sm" />
              )}
              <Link href={item.href} className="cursor-pointer">
                <Button
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-4 py-6 px-5 transition-all duration-300 cursor-pointer text-start h-auto rounded-xl',
                    isActive(item.href) && 'bg-gradient-to-br from-white to-blue-50/40 text-blue-700 font-semibold border border-slate-200 shadow-md',
                    !isActive(item.href) && 'text-slate-700 hover:bg-white/80 hover:shadow-md hover:border hover:border-slate-200'
                  )}
                >
                  <div className="flex items-center justify-center w-6 h-6">{item.icon}</div>
                  <span className="flex-1 text-start text-base font-medium leading-relaxed">{item.title}</span>
                  {item.children && (
                    locale === 'he' ? (
                      <ChevronLeft
                        className={cn(
                          'h-4 w-4 transition-transform duration-300',
                          isActive(item.href) && 'rotate-90'
                        )}
                      />
                    ) : (
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform duration-300',
                          isActive(item.href) && 'rotate-90'
                        )}
                      />
                    )
                  )}
                </Button>
              </Link>

              {/* Children */}
              {item.children && isActive(item.href) && (
                <div className="mt-3 ms-4 flex flex-col gap-2 bg-gradient-to-br from-slate-50/60 to-white/50 rounded-xl p-4 border-s-2 border-blue-200/50 shadow-sm">
                  {item.children.map((child, childIndex) => (
                    <div key={child.href}>
                      {childIndex > 0 && (
                        <div className="my-1.5 h-px bg-gradient-to-r from-slate-200/40 via-slate-300/40 to-transparent" />
                      )}
                      <Link href={child.href} className="cursor-pointer">
                        <Button
                          variant={isActive(child.href) ? 'secondary' : 'ghost'}
                          size="sm"
                          className={cn(
                            'w-full justify-start gap-3 py-5 px-4 transition-all duration-300 cursor-pointer text-start h-auto rounded-lg',
                            isActive(child.href) && 'bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-700 font-semibold shadow-sm border border-blue-200/50',
                            !isActive(child.href) && 'text-slate-600 hover:bg-white/90 hover:text-slate-900 hover:shadow-sm hover:border hover:border-slate-100'
                          )}
                        >
                          <div className="flex items-center justify-center w-5 h-5">{child.icon}</div>
                          <span className="flex-1 text-start text-[15px] font-medium leading-relaxed">{child.title}</span>
                        </Button>
                      </Link>
                    </div>
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
