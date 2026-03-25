import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth';
import { parseSessionToken } from '@/lib/auth-shared';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie');

  if (!cookieHeader) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const sessionCookie = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${authConfig.cookieName}=`));

  const token = sessionCookie?.split('=').slice(1).join('=');
  const user = parseSessionToken(token);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
