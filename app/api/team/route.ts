import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { assertPermission, getSessionUserFromRequest } from '@/lib/auth';
import { createTeamMember, findTeamMemberByEmail, listTeamMembers } from '@/lib/team-store';
import type { TeamPermission, TeamRole } from '@/types/team';

const allowedPermissions: TeamPermission[] = ['calendar', 'finance', 'checkin', 'team'];

function sanitizePermissions(permissions: TeamPermission[] | undefined) {
  if (!permissions?.length) {
    return [];
  }

  return permissions.filter((permission) => allowedPermissions.includes(permission));
}

export async function GET(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'team');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  return NextResponse.json({ members: listTeamMembers() });
}

export async function POST(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'team');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    role?: TeamRole;
    permissions?: TeamPermission[];
  };

  if (!body.name || !body.email || !body.password || !body.role) {
    return NextResponse.json({ message: 'Informe nome, e-mail, senha e papel do usuario.' }, { status: 400 });
  }

  if (body.password.length < 6) {
    return NextResponse.json({ message: 'A senha precisa ter no minimo 6 caracteres.' }, { status: 400 });
  }

  const existingMember = findTeamMemberByEmail(body.email);

  if (existingMember) {
    return NextResponse.json({ message: 'Ja existe uma pessoa da equipe com esse e-mail.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const permissions = sanitizePermissions(body.permissions);

  const member = createTeamMember({
    name: body.name,
    email: body.email,
    passwordHash,
    role: body.role,
    permissions,
  });

  return NextResponse.json({ member }, { status: 201 });
}
