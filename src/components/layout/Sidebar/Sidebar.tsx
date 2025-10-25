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
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: t('cases'),
      href: '/cases',
      icon: <FileText className="h-5 w-5" />,
      children: [
        {
          title: t('wedding'),
          href: '/cases/wedding',
          icon: <Heart className="h-4 w-4" />,
        },
        {
          title: t('cleaning'),
          href: '/cases/cleaning',
          icon: <Users className="h-4 w-4" />,
        },
      ],
    },
    {
      title: t('calendar'),
      href: '/calendar',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: t('applicants'),
      href: '/applicants',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: t('transfers'),
      href: '/transfers',
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: t('settings'),
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const isActive = (href: string) => {
    // Remove locale from pathname for comparison
    // pathname is like "/he/dashboard" or "/en/dashboard"
    // href is like "/dashboard"
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '');
    return pathnameWithoutLocale === href || pathnameWithoutLocale.startsWith(href + '/');
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
              <Link href={item.href} className="cursor-pointer" prefetch={true}>
                <div className="relative">
                  {/* Active indicator bar - positioned according to RTL/LTR */}
                  {isActive(item.href) && (
                    <div
                      className={cn(
                        'absolute top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full',
                        locale === 'he' ? 'right-0' : 'left-0'
                      )}
                    />
                  )}
                  <Button
                    variant={isActive(item.href) ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-4 py-6 transition-all duration-200 cursor-pointer text-start h-auto rounded-xl',
                      locale === 'he' ? 'pe-5 ps-6' : 'ps-5 pe-6',
                      isActive(item.href) && 'bg-gradient-to-br from-blue-50/80 to-blue-50/40 text-blue-700 font-semibold shadow-sm',
                      !isActive(item.href) && 'text-slate-700 hover:bg-white/80 hover:shadow-sm hover:border hover:border-slate-100'
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-6 h-6 rounded-lg transition-colors duration-200",
                      isActive(item.href) && "bg-blue-100/60"
                    )}>
                      {item.icon}
                    </div>
                    <span className="flex-1 text-start text-base font-medium leading-relaxed">{item.title}</span>
                    {item.children && (
                      locale === 'he' ? (
                        <ChevronLeft
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            isActive(item.href) && 'rotate-90'
                          )}
                        />
                      ) : (
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            isActive(item.href) && 'rotate-90'
                          )}
                        />
                      )
                    )}
                  </Button>
                </div>
              </Link>

              {/* Children */}
              {item.children && isActive(item.href) && (
                <div className="mt-3 ms-4 flex flex-col gap-2 bg-gradient-to-br from-slate-50/60 to-white/50 rounded-xl p-4 border-s-2 border-blue-200/50 shadow-sm">
                  {item.children.map((child, childIndex) => (
                    <div key={child.href}>
                      {childIndex > 0 && (
                        <div className="my-1.5 h-px bg-gradient-to-r from-slate-200/40 via-slate-300/40 to-transparent" />
                      )}
                      <Link href={child.href} className="cursor-pointer" prefetch={true}>
                        <div className="relative">
                          {/* Active indicator bar for children */}
                          {isActive(child.href) && (
                            <div
                              className={cn(
                                'absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full',
                                locale === 'he' ? 'right-0' : 'left-0'
                              )}
                            />
                          )}
                          <Button
                            variant={isActive(child.href) ? 'secondary' : 'ghost'}
                            size="sm"
                            className={cn(
                              'w-full justify-start gap-3 py-5 transition-all duration-200 cursor-pointer text-start h-auto rounded-lg',
                              locale === 'he' ? 'pe-4 ps-5' : 'ps-4 pe-5',
                              isActive(child.href) && 'bg-gradient-to-br from-blue-100/80 to-blue-50/50 text-blue-700 font-semibold shadow-sm',
                              !isActive(child.href) && 'text-slate-600 hover:bg-white/90 hover:text-slate-900 hover:shadow-sm hover:border hover:border-slate-100'
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-5 h-5 rounded-md transition-colors duration-200",
                              isActive(child.href) && "bg-blue-200/50"
                            )}>
                              {child.icon}
                            </div>
                            <span className="flex-1 text-start text-[15px] font-medium leading-relaxed">{child.title}</span>
                          </Button>
                        </div>
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
