'use client';

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        <Link href={pathname} locale="he">
          <Button
            variant={locale === 'he' ? 'default' : 'ghost'}
            size="sm"
          >
            עברית
          </Button>
        </Link>
        <Link href={pathname} locale="en">
          <Button
            variant={locale === 'en' ? 'default' : 'ghost'}
            size="sm"
          >
            English
          </Button>
        </Link>
      </div>
    </div>
  );
}
