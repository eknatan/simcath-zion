'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Menu } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/Sidebar';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';

export function Header() {
  const t = useTranslations('navigation');
  const tHeader = useTranslations('header');
  const locale = useLocale();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect to login page after successful logout (locale automatically added)
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
      <div className="flex h-16 items-center px-4 w-full">
        {/* Mobile Menu */}
        <div className="flex items-center gap-4 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{tHeader('toggleMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={locale === 'he' ? 'right' : 'left'} className="w-72 p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 items-center justify-center relative w-20">
            <Image
              src="/logo.png"
              alt={tHeader('systemName')}
              width={250}
              height={130}
              className="h-11 w-auto object-contain"
              style={{
                filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(97%) contrast(91%)'
              }}
              priority
            />
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-slate-900">{tHeader('systemName')}</h1>
            <p className="text-xs text-slate-600">{tHeader('systemDescription')}</p>
          </div>
        </div>

        {/* Right Side - User Info & Actions */}
        <div className="flex items-center gap-4 ms-auto">
          <LanguageSwitcher />

          {/* User Info */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-end text-sm">
              <p className="font-semibold text-slate-900">{user?.email}</p>
              <p className="text-xs text-slate-600">{t('dashboard')}</p>
            </div>
            <Avatar className="h-9 w-9 border-2 border-blue-100">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title={t('logout')}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">{t('logout')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
