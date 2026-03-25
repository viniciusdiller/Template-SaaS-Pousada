import { NextResponse } from 'next/server';
import { authConfig, validateCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };

  if (!body.email || !body.password) {
    return NextResponse.json({ message: 'Informe e-mail e senha.' }, { status: 400 });
  }

  const authResult = await validateCredentials(body.email, body.password);

  if (!authResult.ok) {
    if (authResult.reason === 'login_disabled') {
      return NextResponse.json({ message: 'Este login da equipe esta desativado.' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Credenciais invalidas.' }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    user: authResult.session,
  });

  response.cookies.set(authConfig.cookieName, authResult.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
