'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BedDouble, CalendarPlus2, CalendarRange, LogOut, MoonStar, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarSkeleton } from '@/components/calendar-skeleton';
import { useToast } from '@/components/toast-provider';
import { addDays, cn, differenceInDays, formatDateLabel } from '@/lib/utils';
import { getReservations, getRooms } from '@/services/channexService';
import type { OtaSource, Reservation, Room } from '@/types/channex';

const OTA_STYLES: Record<OtaSource, string> = {
  booking: 'bg-booking/85 text-white',
  expedia: 'bg-expedia/85 text-slate-950',
  hotels_com: 'bg-hotels/85 text-white',
  manual: 'bg-violet-700/90 text-white',
};

const OTA_LABELS: Record<OtaSource, string> = {
  booking: 'Booking.com',
  expedia: 'Expedia',
  hotels_com: 'Hoteis.com',
  manual: 'Lançamento manual',
};

const DAYS_VISIBLE = 10;
const GRID_START = new Date('2026-03-23T00:00:00');

type ManualEntryForm = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  entryType: 'manual_reservation' | 'blocked';
  note: string;
};

const initialManualForm: ManualEntryForm = {
  roomId: '',
  checkIn: '2026-03-23',
  checkOut: '2026-03-24',
  entryType: 'blocked',
  note: '',
};

export function UnifiedCalendar() {
  const router = useRouter();
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<ManualEntryForm>(initialManualForm);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [roomList, reservationList] = await Promise.all([getRooms(), getReservations()]);
      setRooms(roomList);
      setReservations(reservationList);
      setLoading(false);
    }

    void loadData();
  }, []);

  const days = useMemo(() => Array.from({ length: DAYS_VISIBLE }, (_, index) => addDays(GRID_START, index)), []);
  const activeRooms = useMemo(() => rooms.filter((room) => room.status === 'active'), [rooms]);
  const manualEntriesCount = useMemo(
    () => reservations.filter((reservation) => reservation.otaSource === 'manual').length,
    [reservations],
  );

  useEffect(() => {
    if (!manualForm.roomId && activeRooms[0]) {
      setManualForm((current) => ({
        ...current,
        roomId: activeRooms[0].id,
      }));
    }
  }, [activeRooms, manualForm.roomId]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  function openManualEntryModal(roomId?: string, date?: Date) {
    const selectedRoomId = activeRooms.some((room) => room.id === roomId) ? roomId ?? '' : activeRooms[0]?.id ?? '';
    const checkIn = date ? date.toISOString().slice(0, 10) : initialManualForm.checkIn;
    const checkOut = date ? addDays(date, 1).toISOString().slice(0, 10) : initialManualForm.checkOut;

    setManualForm({
      roomId: selectedRoomId,
      checkIn,
      checkOut,
      entryType: 'blocked',
      note: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeManualEntryModal() {
    setIsModalOpen(false);
    setFormError(null);
  }

  async function createManualReservation(entry: ManualEntryForm) {
    await new Promise((resolve) => setTimeout(resolve, 450));

    const nextReservation: Reservation = {
      id: `manual_${Date.now()}`,
      roomId: entry.roomId,
      guestName: entry.note.trim() || (entry.entryType === 'manual_reservation' ? 'Reserva manual' : 'Bloqueio operacional'),
      checkIn: entry.checkIn,
      checkOut: entry.checkOut,
      status: entry.entryType === 'manual_reservation' ? 'confirmed' : 'blocked',
      otaSource: 'manual',
      channelReference: entry.entryType === 'manual_reservation' ? 'MANUAL-RES' : 'MANUAL-BLOCK',
    };

    setReservations((current) => [...current, nextReservation]);
    return nextReservation;
  }

  async function handleManualEntrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!manualForm.roomId || !manualForm.checkIn || !manualForm.checkOut) {
      setFormError('Preencha quarto e período para continuar.');
      return;
    }

    if (manualForm.checkOut <= manualForm.checkIn) {
      setFormError('A data de check-out precisa ser posterior ao check-in.');
      return;
    }

    setIsSaving(true);

    try {
      await createManualReservation(manualForm);
      setIsModalOpen(false);
      showToast('Data bloqueada com sucesso.');
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-[28px] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Calendário da pousada</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Disponibilidade da [Nome da Sua Pousada]</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Acompanhe e gerencie a disponibilidade da sua pousada em tempo real, com visão clara por quarto e por período.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openManualEntryModal()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-glow"
                >
                  <CalendarPlus2 className="h-4 w-4" />
                  Novo lançamento
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-panel rounded-[28px] p-6"
          >
            <div className="flex items-center gap-3 text-sky-200">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm uppercase tracking-[0.3em]">Resumo da operação</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Quartos acompanhados</p>
                <p className="mt-2 text-3xl font-semibold text-white">{rooms.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Reservas e bloqueios</p>
                <p className="mt-2 text-3xl font-semibold text-white">{reservations.length}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm text-violet-100">
              <p className="font-medium">Lançamentos manuais ativos</p>
              <p className="mt-1 text-2xl font-semibold text-white">{manualEntriesCount}</p>
            </div>
          </motion.div>
        </div>

        <div className="glass-panel overflow-x-auto rounded-[28px] p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <CalendarRange className="h-4 w-4 text-sky-300" />
              Janela de {days.length} dias
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <BedDouble className="h-4 w-4 text-emerald" />
              Visão completa por acomodação
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <MoonStar className="h-4 w-4 text-violet-300" />
              Clique em um dia vazio para lançar bloqueio ou reserva manual
            </div>
          </div>

          <div className="min-w-[1280px]">
            <div className="grid grid-cols-[220px_repeat(10,minmax(110px,1fr))] gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300">
                Quartos
              </div>
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-slate-300"
                >
                  {formatDateLabel(day)}
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-3">
              {rooms.map((room) => {
                const roomReservations = reservations.filter((reservation) => reservation.roomId === room.id);

                return (
                  <div key={room.id} className="grid grid-cols-[220px_repeat(10,minmax(110px,1fr))] gap-3">
                    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
                      <p className="font-medium text-white">{room.name}</p>
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                        <span>{room.maxGuests} hóspedes</span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-xs',
                            room.status === 'active'
                              ? 'bg-emerald/15 text-emerald'
                              : 'bg-amber-400/15 text-amber-300',
                          )}
                        >
                          {room.status === 'active' ? 'Ativo' : 'Manutenção'}
                        </span>
                      </div>
                    </div>

                    <div className="relative col-span-10 grid grid-cols-10 gap-3 rounded-3xl border border-white/10 bg-slate-950/30 p-3">
                      {days.map((day) => (
                        <motion.button
                          key={`${room.id}-${day.toISOString()}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => openManualEntryModal(room.id, day)}
                          className="h-24 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-left transition-colors hover:border-sky-300/40 hover:bg-sky-400/5"
                          aria-label={`Criar lançamento para ${room.name} em ${formatDateLabel(day)}`}
                        />
                      ))}

                      {roomReservations.map((reservation) => {
                        const startOffset = differenceInDays(GRID_START, new Date(`${reservation.checkIn}T00:00:00`)) - 1;
                        const duration = differenceInDays(
                          new Date(`${reservation.checkIn}T00:00:00`),
                          new Date(`${reservation.checkOut}T00:00:00`),
                        );

                        return (
                          <motion.div
                            key={reservation.id}
                            layout
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              'absolute top-3 flex h-24 flex-col justify-between rounded-2xl p-3 shadow-lg',
                              OTA_STYLES[reservation.otaSource],
                            )}
                            style={{
                              left: `calc(${Math.max(0, startOffset)} * (100% / 10) + ${Math.max(0, startOffset)} * 0.75rem + 0.75rem)`,
                              width: `calc(${Math.min(duration, 10)} * (100% / 10) + ${Math.max(Math.min(duration, 10) - 1, 0)} * 0.75rem - 0.75rem)`,
                            }}
                          >
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                                {OTA_LABELS[reservation.otaSource]}
                              </p>
                              <p className="mt-2 text-sm font-semibold">{reservation.guestName}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-90">
                              <span>{reservation.channelReference}</span>
                              <span>{reservation.status === 'blocked' ? 'bloqueado' : 'confirmado'}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="glass-panel w-full max-w-2xl rounded-[32px] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-violet-200">Lançamento manual</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Adicionar reserva ou bloqueio</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Registre períodos ocupados, manutenção ou reservas criadas diretamente pela sua equipe.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeManualEntryModal}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              <form onSubmit={handleManualEntrySubmit} className="mt-8 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Seleção de quarto</span>
                    <select
                      value={manualForm.roomId}
                      onChange={(event) => setManualForm((current) => ({ ...current, roomId: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none"
                    >
                      {activeRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Status</span>
                    <select
                      value={manualForm.entryType}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          entryType: event.target.value as ManualEntryForm['entryType'],
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none"
                    >
                      <option value="manual_reservation">Reserva Manual</option>
                      <option value="blocked">Bloqueado (Ocupado/Manutenção)</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Check-in</span>
                    <input
                      type="date"
                      value={manualForm.checkIn}
                      onChange={(event) => setManualForm((current) => ({ ...current, checkIn: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Check-out</span>
                    <input
                      type="date"
                      value={manualForm.checkOut}
                      onChange={(event) => setManualForm((current) => ({ ...current, checkOut: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Nome do hóspede / motivo</span>
                  <input
                    type="text"
                    value={manualForm.note}
                    onChange={(event) => setManualForm((current) => ({ ...current, note: event.target.value }))}
                    placeholder="Ex.: Família Souza ou manutenção do banheiro"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </label>

                {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={closeManualEntryModal}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSaving}
                    className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
