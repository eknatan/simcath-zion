'use client';

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <Link href={pathname} locale="he">
          <Button
            variant={locale === 'he' ? 'default' : 'ghost'}
            size="sm"
          >
            עב
          </Button>
        </Link>
        <Link href={pathname} locale="en">
          <Button
            variant={locale === 'en' ? 'default' : 'ghost'}
            size="sm"
          >
            En
          </Button>
        </Link>
      </div>
    </div>
  );
}
