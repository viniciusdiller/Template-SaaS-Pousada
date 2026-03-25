import bcrypt from 'bcryptjs';
import type { TeamMember, TeamMemberWithPassword, TeamPermission, TeamRole } from '@/types/team';

const ownerPermissions: TeamPermission[] = ['calendar', 'finance', 'checkin', 'team'];

let teamMembers: TeamMemberWithPassword[] = [
  {
    id: 'owner_001',
    name: 'Administrador',
    email: 'admin@pousadasancho.com',
    role: 'owner',
    permissions: ownerPermissions,
    loginEnabled: true,
    passwordHash: bcrypt.hashSync('sancho123', 10),
    createdAt: new Date('2026-03-23T09:00:00.000Z').toISOString(),
  },
  {
    id: 'team_002',
    name: 'Camila Nunes',
    email: 'camila.recepcao@pousadasancho.com',
    role: 'staff',
    permissions: ['calendar', 'checkin'],
    loginEnabled: true,
    passwordHash: bcrypt.hashSync('equipe123', 10),
    createdAt: new Date('2026-03-23T09:30:00.000Z').toISOString(),
  },
  {
    id: 'team_003',
    name: 'Rodrigo Lima',
    email: 'rodrigo.financeiro@pousadasancho.com',
    role: 'staff',
    permissions: ['finance', 'calendar'],
    loginEnabled: true,
    passwordHash: bcrypt.hashSync('finance123', 10),
    createdAt: new Date('2026-03-23T10:00:00.000Z').toISOString(),
  },
  {
    id: 'team_004',
    name: 'Ana Costa',
    email: 'ana.governanca@pousadasancho.com',
    role: 'staff',
    permissions: ['checkin'],
    loginEnabled: false,
    passwordHash: bcrypt.hashSync('governanca123', 10),
    createdAt: new Date('2026-03-23T10:30:00.000Z').toISOString(),
  },
];

function sanitize(member: TeamMemberWithPassword): TeamMember {
  const { passwordHash: _passwordHash, ...safeMember } = member;
  return safeMember;
}

export function listTeamMembers() {
  return teamMembers.map(sanitize);
}

export function findTeamMemberByEmail(email: string) {
  return teamMembers.find((member) => member.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function findTeamMemberById(id: string) {
  return teamMembers.find((member) => member.id === id) ?? null;
}

export function createTeamMember(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: TeamRole;
  permissions: TeamPermission[];
}) {
  const member: TeamMemberWithPassword = {
    id: `team_${Date.now()}`,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    role: input.role,
    permissions: input.role === 'owner' ? ownerPermissions : input.permissions,
    loginEnabled: true,
    createdAt: new Date().toISOString(),
  };

  teamMembers = [member, ...teamMembers];
  return sanitize(member);
}

export function updateTeamMember(
  id: string,
  input: {
    name?: string;
    role?: TeamRole;
    permissions?: TeamPermission[];
    loginEnabled?: boolean;
  },
) {
  const current = findTeamMemberById(id);

  if (!current) {
    return null;
  }

  const nextRole = input.role ?? current.role;

  const updatedMember: TeamMemberWithPassword = {
    ...current,
    name: input.name ?? current.name,
    role: nextRole,
    permissions: nextRole === 'owner' ? ownerPermissions : input.permissions ?? current.permissions,
    loginEnabled: input.loginEnabled ?? current.loginEnabled,
  };

  teamMembers = teamMembers.map((member) => (member.id === id ? updatedMember : member));
  return sanitize(updatedMember);
}

export function removeTeamMember(id: string) {
  const current = findTeamMemberById(id);

  if (!current || current.role === 'owner') {
    return false;
  }

  teamMembers = teamMembers.filter((member) => member.id !== id);
  return true;
}

export function setTeamMemberLoginStatus(id: string, enabled: boolean) {
  const current = findTeamMemberById(id);

  if (!current || current.role === 'owner') {
    return null;
  }

  const updatedMember: TeamMemberWithPassword = {
    ...current,
    loginEnabled: enabled,
  };

  teamMembers = teamMembers.map((member) => (member.id === id ? updatedMember : member));
  return sanitize(updatedMember);
}
