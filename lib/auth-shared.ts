import type { TeamPermission, TeamRole } from '@/types/team';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  permissions: TeamPermission[];
};

export const authConfig = {
  cookieName: 'sancho_session',
};

export const permissionLabels: Record<TeamPermission, string> = {
  calendar: 'Calendario',
  finance: 'Financeiro',
  checkin: 'Check-in e Check-out',
  team: 'Equipe',
};

function encodeBase64Url(value: string) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64url');
  }

  const encoded = btoa(value);
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64url').toString('utf-8');
  }

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

export function createSessionToken(user: SessionUser) {
  return encodeBase64Url(JSON.stringify(user));
}

export function parseSessionToken(token: string | undefined | null): SessionUser | null {
  if (!token) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(token)) as SessionUser;

    if (!parsed?.id || !parsed?.email || !parsed?.role || !Array.isArray(parsed.permissions)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function hasPermission(user: SessionUser | null, permission: TeamPermission) {
  if (!user) {
    return false;
  }

  if (user.role === 'owner') {
    return true;
  }

  return user.permissions.includes(permission);
}

export function firstAllowedDashboardRoute(user: SessionUser | null) {
  if (!user) {
    return '/';
  }

  if (hasPermission(user, 'calendar')) {
    return '/dashboard/calendar';
  }

  if (hasPermission(user, 'checkin')) {
    return '/dashboard/checkin';
  }

  if (hasPermission(user, 'finance')) {
    return '/dashboard/finance';
  }

  if (hasPermission(user, 'team')) {
    return '/dashboard/team';
  }

  return '/';
}
