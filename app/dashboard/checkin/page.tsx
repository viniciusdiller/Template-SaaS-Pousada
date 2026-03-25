'use client';

import { CheckCircle2, LogOut, RefreshCcw, UserCheck, UserRoundX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/toast-provider';
import type { Reservation } from '@/types/channex';

type BoardResponse = {
  date: string;
  arrivals: Reservation[];
  departures: Reservation[];
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatDateTime(dateTime: string | null | undefined) {
  if (!dateTime) {
    return 'Pendente';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateTime));
}

export default function CheckInPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingReservationId, setSavingReservationId] = useState<string | null>(null);

  async function loadBoard() {
    setLoading(true);

    const response = await fetch('/api/checkin');

    if (response.status === 403) {
      router.push('/dashboard/calendar');
      return;
    }

    const payload = (await response.json()) as BoardResponse;
    setBoard(payload);
    setLoading(false);
  }

  useEffect(() => {
    void loadBoard();
  }, []);

  const pendingArrivals = useMemo(
    () => (board?.arrivals ?? []).filter((reservation) => !reservation.checkedInAt).length,
    [board],
  );

  const pendingDepartures = useMemo(
    () => (board?.departures ?? []).filter((reservation) => reservation.checkedInAt && !reservation.checkedOutAt).length,
    [board],
  );

  async function handleAction(reservationId: string, action: 'checkin' | 'checkout') {
    setSavingReservationId(reservationId);

    const response = await fetch('/api/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reservationId, action }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      showToast(payload.message ?? 'Nao foi possivel atualizar o status da reserva.');
      setSavingReservationId(null);
      return;
    }

    showToast(action === 'checkin' ? 'Check-in registrado com sucesso.' : 'Check-out registrado com sucesso.');
    await loadBoard();
    setSavingReservationId(null);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Operacao de hospedagem</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Check-in e check-out do dia</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Controle chegadas e saidas em tempo real para manter recepcao e governanca alinhadas.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void loadBoard()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-medium text-slate-200"
            >
              <RefreshCcw className="h-4 w-4" />
              Atualizar
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-medium text-slate-200"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[26px] border border-white/10 bg-slate-900/80 p-5">
          <p className="text-sm text-slate-400">Data operacional</p>
          <p className="mt-3 text-2xl font-semibold text-white">{board ? formatDate(board.date) : '--/--/----'}</p>
        </div>
        <div className="rounded-[26px] border border-white/10 bg-slate-900/80 p-5">
          <p className="text-sm text-slate-400">Chegadas pendentes</p>
          <p className="mt-3 text-2xl font-semibold text-amber-200">{pendingArrivals}</p>
        </div>
        <div className="rounded-[26px] border border-white/10 bg-slate-900/80 p-5">
          <p className="text-sm text-slate-400">Saidas pendentes</p>
          <p className="mt-3 text-2xl font-semibold text-rose-200">{pendingDepartures}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <h3 className="text-xl font-semibold text-white">Chegadas de hoje</h3>
          <p className="mt-2 text-sm text-slate-400">Registre a entrada assim que o hospede concluir a recepcao.</p>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">Carregando check-ins...</p>
            ) : board?.arrivals.length ? (
              board.arrivals.map((reservation) => {
                const checkedIn = Boolean(reservation.checkedInAt);
                return (
                  <div key={reservation.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{reservation.customer.name}</p>
                        <p className="mt-1 text-xs text-slate-400">Ref: {reservation.channelReference}</p>
                        <p className="mt-2 text-xs text-slate-400">Check-in: {formatDateTime(reservation.checkedInAt)}</p>
                      </div>
                      <button
                        disabled={checkedIn || savingReservationId === reservation.id}
                        onClick={() => void handleAction(reservation.id, 'checkin')}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                          checkedIn
                            ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-100'
                            : 'border-emerald-400/40 bg-emerald-500 text-white hover:bg-emerald-400'
                        }`}
                      >
                        <UserCheck className="h-4 w-4" />
                        {checkedIn ? 'Concluido' : 'Fazer check-in'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">Nenhuma chegada para hoje.</p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <h3 className="text-xl font-semibold text-white">Saidas de hoje</h3>
          <p className="mt-2 text-sm text-slate-400">Libere o quarto com check-out apos conferencia de consumo e chaves.</p>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">Carregando check-outs...</p>
            ) : board?.departures.length ? (
              board.departures.map((reservation) => {
                const canCheckout = Boolean(reservation.checkedInAt) && !reservation.checkedOutAt;
                const alreadyDone = Boolean(reservation.checkedOutAt);

                return (
                  <div key={reservation.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{reservation.customer.name}</p>
                        <p className="mt-1 text-xs text-slate-400">Ref: {reservation.channelReference}</p>
                        <p className="mt-2 text-xs text-slate-400">Check-out: {formatDateTime(reservation.checkedOutAt)}</p>
                        {!reservation.checkedInAt ? (
                          <p className="mt-1 text-xs text-amber-200">Check-in ainda nao registrado.</p>
                        ) : null}
                      </div>

                      <button
                        disabled={!canCheckout || savingReservationId === reservation.id}
                        onClick={() => void handleAction(reservation.id, 'checkout')}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
                      >
                        <UserRoundX className="h-4 w-4" />
                        {alreadyDone ? 'Concluido' : 'Fazer check-out'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">Nenhuma saida para hoje.</p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
        <div className="inline-flex items-center gap-2 text-sm text-slate-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          Processo operacional padronizado para recepcao, governanca e financeiro.
        </div>
      </section>
    </div>
  );
}
