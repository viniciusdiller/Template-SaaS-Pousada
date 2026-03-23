import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthenticated = request.cookies.get(authConfig.cookieName)?.value === 'authenticated';

  if (isDashboardRoute && !isAuthenticated) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard/calendar', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
