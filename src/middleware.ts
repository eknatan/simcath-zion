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
const publicRoutes = ['/login', '/public-forms'];

export async function middleware(request: NextRequest) {
  // First, apply internationalization
  let response = intlMiddleware(request);

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Remove locale prefix to check route
  const pathnameWithoutLocale = pathname.replace(/^\/(he|en)/, '');

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Redirect to login if not authenticated and not on public route
  if (!session && !isPublicRoute) {
    const locale = request.nextUrl.locale || 'he';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if authenticated and on login page
  if (session && pathnameWithoutLocale === '/login') {
    const locale = request.nextUrl.locale || 'he';
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static files)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Match all pathnames
    '/',
    '/(he|en)/:path*'
  ]
};
