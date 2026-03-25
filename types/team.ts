export type TeamRole = 'owner' | 'staff';

export type TeamPermission = 'calendar' | 'finance' | 'checkin' | 'team';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  permissions: TeamPermission[];
  loginEnabled: boolean;
  createdAt: string;
};

export type TeamMemberWithPassword = TeamMember & {
  passwordHash: string;
};
