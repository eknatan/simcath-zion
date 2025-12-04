import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';

// Create intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ['he', 'en'],
  defaultLocale: 'he',
  localePrefix: 'as-needed'
});

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/public-forms',
  '/auth/callback',      // User invitation & email confirmation
  '/auth/reset-password' // Password reset
];

export async function middleware(request: NextRequest) {
  // Parse locale from pathname
  const pathname = request.nextUrl.pathname;
  const locale = pathname.match(/^\/(he|en)/)?.[1] || 'he';

  // Remove locale prefix to check route
  const pathnameWithoutLocale = pathname.replace(/^\/(he|en)/, '');

  // First, apply internationalization and create response
  const response = intlMiddleware(request);

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Only set cookies on the response object
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check if user is authenticated
  // Using getSession() for faster response (reads from cookie, no DB round-trip)
  // getUser() makes a DB call (~50-100ms) - only needed for sensitive operations
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Redirect to login if not authenticated and not on public route
  if (!session && !isPublicRoute) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if authenticated and on login page
  if (session && pathnameWithoutLocale === '/login') {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static files, images)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)',
    // Match all pathnames
    '/',
    '/(he|en)/:path*'
  ]
};
