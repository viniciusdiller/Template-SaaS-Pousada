import bcrypt from 'bcryptjs';
import type { TeamPermission } from '@/types/team';
import { authConfig, createSessionToken, hasPermission, parseSessionToken, type SessionUser } from '@/lib/auth-shared';
import { findTeamMemberByEmail } from '@/lib/team-store';

export { authConfig, firstAllowedDashboardRoute, permissionLabels } from '@/lib/auth-shared';

type AuthValidationResult =
  | {
      ok: true;
      session: SessionUser;
      token: string;
    }
  | {
      ok: false;
      reason: 'invalid_credentials' | 'login_disabled';
    };

export async function validateCredentials(email: string, password: string) {
  const member = findTeamMemberByEmail(email);

  if (!member) {
    return {
      ok: false,
      reason: 'invalid_credentials',
    } satisfies AuthValidationResult;
  }

  if (!member.loginEnabled) {
    return {
      ok: false,
      reason: 'login_disabled',
    } satisfies AuthValidationResult;
  }

  const isValid = await bcrypt.compare(password, member.passwordHash);

  if (!isValid) {
    return {
      ok: false,
      reason: 'invalid_credentials',
    } satisfies AuthValidationResult;
  }

  const session: SessionUser = {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    permissions: member.permissions,
  };

  return {
    ok: true,
    session,
    token: createSessionToken(session),
  } satisfies AuthValidationResult;
}

export function getSessionUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie');

  if (!cookieHeader) {
    return null;
  }

  const cookieMap = cookieHeader.split(';').reduce<Record<string, string>>((acc, item) => {
    const [rawName, ...rawValue] = item.trim().split('=');

    if (!rawName) {
      return acc;
    }

    acc[decodeURIComponent(rawName)] = decodeURIComponent(rawValue.join('='));
    return acc;
  }, {});

  return parseSessionToken(cookieMap[authConfig.cookieName]);
}

export function assertPermission(user: SessionUser | null, permission: TeamPermission) {
  if (!hasPermission(user, permission)) {
    return new Response(JSON.stringify({ message: 'Voce nao tem permissao para esta funcionalidade.' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return null;
}
