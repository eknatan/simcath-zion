import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['he', 'en'],

  // Used when no locale matches
  defaultLocale: 'he',

  // Don't use a prefix for the default locale
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(he|en)/:path*']
};
