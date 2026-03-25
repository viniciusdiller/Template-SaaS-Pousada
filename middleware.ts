import { NextRequest, NextResponse } from 'next/server';
import { authConfig, firstAllowedDashboardRoute, hasPermission, parseSessionToken } from '@/lib/auth-shared';

function canAccessPath(pathname: string, tokenValue: string | undefined) {
  const user = parseSessionToken(tokenValue);

  if (!user) {
    return false;
  }

  if (pathname.startsWith('/dashboard/calendar')) {
    return hasPermission(user, 'calendar');
  }

  if (pathname.startsWith('/dashboard/finance')) {
    return hasPermission(user, 'finance');
  }

  if (pathname.startsWith('/dashboard/checkin')) {
    return hasPermission(user, 'checkin');
  }

  if (pathname.startsWith('/dashboard/team')) {
    return hasPermission(user, 'team');
  }

  return true;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const tokenValue = request.cookies.get(authConfig.cookieName)?.value;
  const isAuthenticated = Boolean(parseSessionToken(tokenValue));

  if (isDashboardRoute && !isAuthenticated) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isDashboardRoute && !canAccessPath(pathname, tokenValue)) {
    const redirectPath = firstAllowedDashboardRoute(parseSessionToken(tokenValue));
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  if (pathname === '/' && isAuthenticated) {
    const redirectPath = firstAllowedDashboardRoute(parseSessionToken(tokenValue));
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
