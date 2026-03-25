import { NextResponse } from 'next/server';
import { assertPermission, getSessionUserFromRequest } from '@/lib/auth';
import { removeTeamMember, setTeamMemberLoginStatus, updateTeamMember } from '@/lib/team-store';
import type { TeamPermission, TeamRole } from '@/types/team';

const allowedPermissions: TeamPermission[] = ['calendar', 'finance', 'checkin', 'team'];

function sanitizePermissions(permissions: TeamPermission[] | undefined) {
  if (!permissions?.length) {
    return [];
  }

  return permissions.filter((permission) => allowedPermissions.includes(permission));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'team');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    role?: TeamRole;
    permissions?: TeamPermission[];
    loginEnabled?: boolean;
  };

  if (typeof body.loginEnabled === 'boolean' && Object.keys(body).length === 1) {
    const member = setTeamMemberLoginStatus(id, body.loginEnabled);

    if (!member) {
      return NextResponse.json({ message: 'Nao foi possivel alterar o status deste login.' }, { status: 400 });
    }

    return NextResponse.json({ member });
  }

  const member = updateTeamMember(id, {
    name: body.name,
    role: body.role,
    permissions: sanitizePermissions(body.permissions),
    loginEnabled: body.loginEnabled,
  });

  if (!member) {
    return NextResponse.json({ message: 'Pessoa da equipe nao encontrada.' }, { status: 404 });
  }

  return NextResponse.json({ member });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'team');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { id } = await params;
  const removed = removeTeamMember(id);

  if (!removed) {
    return NextResponse.json({ message: 'Nao foi possivel remover esta conta.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
