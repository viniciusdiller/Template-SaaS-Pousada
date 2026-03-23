import { NextResponse } from 'next/server';
import { authConfig, validateCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };

  if (!body.email || !body.password) {
    return NextResponse.json({ message: 'Informe e-mail e senha.' }, { status: 400 });
  }

  const isValid = await validateCredentials(body.email, body.password);

  if (!isValid) {
    return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(authConfig.cookieName, 'authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
