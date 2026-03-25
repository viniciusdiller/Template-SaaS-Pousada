'use client';

import { LoaderCircle, Lock, LockOpen, Save, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/toast-provider';
import type { TeamMember, TeamPermission, TeamRole } from '@/types/team';

const availablePermissions: Array<{ key: TeamPermission; label: string }> = [
  { key: 'calendar', label: 'Calendario' },
  { key: 'finance', label: 'Financeiro' },
  { key: 'checkin', label: 'Check-in e Check-out' },
  { key: 'team', label: 'Equipe' },
];

const teamProfiles: Array<{ key: string; label: string; permissions: TeamPermission[] }> = [
  { key: 'custom', label: 'Personalizado', permissions: [] },
  { key: 'frontdesk', label: 'Recepcao', permissions: ['calendar', 'checkin'] },
  { key: 'finance', label: 'Financeiro', permissions: ['finance', 'calendar'] },
  { key: 'operations', label: 'Operacoes', permissions: ['checkin', 'calendar'] },
  { key: 'manager', label: 'Gerente de Turno', permissions: ['calendar', 'checkin', 'finance'] },
  { key: 'it', label: 'Suporte Administrativo', permissions: ['calendar', 'team'] },
];

type CreateMemberForm = {
  name: string;
  email: string;
  password: string;
  role: TeamRole;
  profile: string;
  permissions: TeamPermission[];
};

const initialForm: CreateMemberForm = {
  name: '',
  email: '',
  password: '',
  role: 'staff',
  profile: 'frontdesk',
  permissions: ['calendar', 'checkin'],
};

export default function TeamPage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateMemberForm>(initialForm);

  async function loadMembers() {
    setLoading(true);
    const response = await fetch('/api/team');

    if (response.status === 403) {
      showToast('Somente o dono da pousada pode gerir a equipe.');
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as { members: TeamMember[] };
    setMembers(payload.members);
    setLoading(false);
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  function togglePermission(permission: TeamPermission, checked: boolean) {
    setForm((current) => {
      const nextPermissions = checked
        ? Array.from(new Set([...current.permissions, permission]))
        : current.permissions.filter((item) => item !== permission);

      return {
        ...current,
        permissions: nextPermissions,
      };
    });
  }

  function applyProfile(profileKey: string) {
    const selectedProfile = teamProfiles.find((profile) => profile.key === profileKey);

    setForm((current) => ({
      ...current,
      profile: profileKey,
      permissions:
        current.role === 'owner' ? ['calendar', 'finance', 'checkin', 'team'] : selectedProfile?.permissions ?? current.permissions,
    }));
  }

  async function handleCreateMember() {
    if (!form.name || !form.email || !form.password) {
      showToast('Preencha nome, e-mail e senha para criar o login da equipe.');
      return;
    }

    if (form.role === 'staff' && form.permissions.length === 0) {
      showToast('Selecione ao menos uma funcionalidade para este usuario.');
      return;
    }

    setSaving(true);

    const response = await fetch('/api/team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as { member?: TeamMember; message?: string };

    if (!response.ok) {
      showToast(payload.message ?? 'Nao foi possivel criar a conta da equipe.');
      setSaving(false);
      return;
    }

    showToast('Membro da equipe criado com login individual.');
    setForm(initialForm);
    await loadMembers();
    setSaving(false);
  }

  async function handleUpdateMember(member: TeamMember) {
    if (member.role === 'owner') {
      return;
    }

    setUpdatingMemberId(member.id);

    const response = await fetch(`/api/team/${member.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: member.role,
        permissions: member.permissions,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      showToast(payload.message ?? 'Nao foi possivel salvar as permissoes.');
      setUpdatingMemberId(null);
      return;
    }

    showToast('Permissoes atualizadas com sucesso.');
    await loadMembers();
    setUpdatingMemberId(null);
  }

  async function handleDeleteMember(memberId: string) {
    setUpdatingMemberId(memberId);

    const response = await fetch(`/api/team/${memberId}`, {
      method: 'DELETE',
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      showToast(payload.message ?? 'Nao foi possivel remover a conta.');
      setUpdatingMemberId(null);
      return;
    }

    showToast('Conta removida da equipe.');
    await loadMembers();
    setUpdatingMemberId(null);
  }

  async function handleToggleLogin(member: TeamMember) {
    if (member.role === 'owner') {
      return;
    }

    setUpdatingMemberId(member.id);

    const response = await fetch(`/api/team/${member.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loginEnabled: !member.loginEnabled,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      showToast(payload.message ?? 'Nao foi possivel alterar o status de login.');
      setUpdatingMemberId(null);
      return;
    }

    showToast(member.loginEnabled ? 'Login desativado com sucesso.' : 'Login ativado com sucesso.');
    await loadMembers();
    setUpdatingMemberId(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-slate-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Gestao de equipe</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Usuarios, logins e permissoes</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Crie um login para cada pessoa da equipe e defina exatamente quais funcionalidades ela pode acessar no sistema.
        </p>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-cyan-950/40 p-6">
        <div className="flex items-center gap-2 text-white">
          <UserPlus className="h-5 w-5 text-sky-300" />
          <h3 className="text-xl font-semibold">Novo membro da equipe</h3>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Nome</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
              placeholder="Ex.: Joao da Recepcao"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">E-mail de login</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
              placeholder="recepcao@pousada.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Senha inicial</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
              placeholder="minimo 6 caracteres"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Papel</span>
            <select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as TeamRole,
                  permissions: event.target.value === 'owner' ? ['calendar', 'finance', 'checkin', 'team'] : current.permissions,
                }))
              }
              className="w-full rounded-2xl border border-cyan-200/20 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-300/40 focus:bg-slate-950/90 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="staff" className="bg-slate-900 text-slate-100">
                Equipe
              </option>
              <option value="owner" className="bg-slate-900 text-slate-100">
                Dono
              </option>
            </select>
          </label>

          {form.role !== 'owner' ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Perfil da equipe</span>
              <select
                value={form.profile}
                onChange={(event) => applyProfile(event.target.value)}
                className="w-full rounded-2xl border border-cyan-200/20 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-300/40 focus:bg-slate-950/90 focus:ring-2 focus:ring-cyan-400/20"
              >
                {teamProfiles.map((profile) => (
                  <option key={profile.key} value={profile.key} className="bg-slate-900 text-slate-100">
                    {profile.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm font-medium text-slate-100">Funcionalidades liberadas</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {availablePermissions.map((permission) => {
              const checked = form.role === 'owner' || form.permissions.includes(permission.key);
              const disabled = form.role === 'owner';

              return (
                <label key={permission.key} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => togglePermission(permission.key, event.target.checked)}
                    className="h-4 w-4 accent-cyan-400"
                  />
                  {permission.label}
                </label>
              );
            })}
          </div>
        </div>

        {form.role !== 'owner' ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {teamProfiles
              .filter((profile) => profile.key !== 'custom')
              .map((profile) => (
                <button
                  key={profile.key}
                  type="button"
                  onClick={() => applyProfile(profile.key)}
                  className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100"
                >
                  {profile.label}
                </button>
              ))}
          </div>
        ) : null}

        <button
          onClick={() => void handleCreateMember()}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-70"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Criar login da equipe
        </button>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
        <div className="flex items-center gap-2 text-white">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          <h3 className="text-xl font-semibold">Equipe cadastrada</h3>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-400">Carregando equipe...</p>
          ) : members.length ? (
            members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">{member.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                          member.loginEnabled
                            ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                            : 'border border-amber-300/30 bg-amber-300/10 text-amber-100'
                        }`}
                      >
                        {member.loginEnabled ? 'Login ativo' : 'Login desativado'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{member.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{member.role}</p>
                  </div>

                  {member.role === 'owner' ? (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      Acesso total
                    </span>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleToggleLogin(member)}
                        disabled={updatingMemberId === member.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-100 disabled:opacity-70"
                      >
                        {member.loginEnabled ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                        {member.loginEnabled ? 'Desativar login' : 'Ativar login'}
                      </button>
                      <button
                        onClick={() => void handleUpdateMember(member)}
                        disabled={updatingMemberId === member.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 disabled:opacity-70"
                      >
                        <Save className="h-4 w-4" />
                        Salvar
                      </button>
                      <button
                        onClick={() => void handleDeleteMember(member.id)}
                        disabled={updatingMemberId === member.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 disabled:opacity-70"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>

                {member.role === 'staff' ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {availablePermissions.map((permission) => (
                      <label key={permission.key} className="flex items-center gap-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={member.permissions.includes(permission.key)}
                          onChange={(event) => {
                            setMembers((current) =>
                              current.map((currentMember) => {
                                if (currentMember.id !== member.id) {
                                  return currentMember;
                                }

                                const nextPermissions = event.target.checked
                                  ? Array.from(new Set([...currentMember.permissions, permission.key]))
                                  : currentMember.permissions.filter((item) => item !== permission.key);

                                return {
                                  ...currentMember,
                                  permissions: nextPermissions,
                                };
                              }),
                            );
                          }}
                        />
                        {permission.label}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">Nenhum membro cadastrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}
