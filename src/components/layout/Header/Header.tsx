'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Menu } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/Sidebar';
import { useRouter } from 'next/navigation';

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
      // Redirect to login page after successful logout
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
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
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">{locale === 'he' ? 'צח' : 'FS'}</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold">{tHeader('systemName')}</h1>
            <p className="text-xs text-muted-foreground">{tHeader('systemDescription')}</p>
          </div>
        </div>

        {/* Right Side - User Info & Actions */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {/* User Info */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-end text-sm">
              <p className="font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard')}</p>
            </div>
            <Avatar>
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
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
