'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  BedDouble,
  CalendarDays,
  CalendarClock,
  CalendarPlus2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  LogOut,
  Mail,
  MoonStar,
  Phone,
  Receipt,
  ScrollText,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarSkeleton } from '@/components/calendar-skeleton';
import { useToast } from '@/components/toast-provider';
import { addDays, cn, differenceInDays, formatCurrencyInput, formatDateLabel, parseCurrencyInput } from '@/lib/utils';
import { getReservations, getRooms, updateReservation } from '@/services/channexService';
import type { OtaSource, Reservation, ReservationStatus, Room } from '@/types/channex';

const OTA_STYLES: Record<OtaSource, string> = {
  booking: 'bg-booking text-white',
  expedia: 'bg-expedia text-slate-950',
  hotels_com: 'bg-hotels text-white',
  manual: 'bg-violet-600 text-white',
};

const OTA_LABELS: Record<OtaSource, string> = {
  booking: 'Booking.com',
  expedia: 'Expedia',
  hotels_com: 'Hotels.com',
  manual: 'Manual',
};

const STATUS_LABELS: Record<ReservationStatus, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendente',
  cancelled: 'Cancelada',
  blocked: 'Bloqueada',
};

const STATUS_STYLES: Record<ReservationStatus, string> = {
  confirmed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  pending: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  cancelled: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  blocked: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
};

const DAY_RANGE_OPTIONS = [7, 14, 21, 30] as const;
const DEFAULT_DAYS_VISIBLE = 14;
const GRID_START = new Date('2026-03-23T00:00:00');

type ManualEntryForm = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  entryType: 'manual_reservation' | 'blocked';
  note: string;
};

type ReservationDraft = {
  id: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  otaSource: OtaSource;
  channelReference: string;
  amount: string;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
};

const initialManualForm: ManualEntryForm = {
  roomId: '',
  checkIn: '2026-03-23',
  checkOut: '2026-03-24',
  entryType: 'blocked',
  note: '',
};

function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function createDraft(reservation: Reservation): ReservationDraft {
  return {
    id: reservation.id,
    roomId: reservation.roomId,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    status: reservation.status,
    otaSource: reservation.otaSource,
    channelReference: reservation.channelReference,
    amount: formatCurrencyInput(String(Math.round(reservation.amount * 100)), reservation.currency),
    currency: reservation.currency,
    customerName: reservation.customer.name,
    customerEmail: reservation.customer.email,
    customerPhone: reservation.customer.phone,
    notes: reservation.notes,
  };
}

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
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReservationDraft | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [isUpdatingReservation, setIsUpdatingReservation] = useState(false);
  const [daysVisible, setDaysVisible] = useState<number>(DEFAULT_DAYS_VISIBLE);
  const [gridStart, setGridStart] = useState<Date>(GRID_START);

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

  const visibleReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status !== 'cancelled'),
    [reservations],
  );
  const days = useMemo(() => Array.from({ length: daysVisible }, (_, index) => addDays(gridStart, index)), [daysVisible, gridStart]);
  const activeRooms = useMemo(() => rooms.filter((room) => room.status === 'active'), [rooms]);
  const manualEntriesCount = useMemo(
    () => visibleReservations.filter((reservation) => reservation.otaSource === 'manual').length,
    [visibleReservations],
  );
  const confirmedRevenue = useMemo(
    () =>
      visibleReservations
        .filter((reservation) => reservation.status !== 'blocked')
        .reduce((sum, item) => sum + item.amount, 0),
    [visibleReservations],
  );
  const occupancy = useMemo(() => {
    const totalSlots = activeRooms.length * days.length;
    const rangeEnd = addDays(gridStart, days.length);
    const usedSlots = visibleReservations.reduce((sum, reservation) => {
      const start = new Date(`${reservation.checkIn}T00:00:00`);
      const end = new Date(`${reservation.checkOut}T00:00:00`);
      const visibleStart = start > gridStart ? start : gridStart;
      const visibleEnd = end < rangeEnd ? end : rangeEnd;

      if (visibleEnd <= visibleStart) {
        return sum;
      }

      return sum + differenceInDays(visibleStart, visibleEnd);
    }, 0);

    return totalSlots ? Math.min(100, Math.round((usedSlots / totalSlots) * 100)) : 0;
  }, [activeRooms.length, days.length, gridStart, visibleReservations]);

  const selectedReservation = useMemo(
    () => reservations.find((reservation) => reservation.id === selectedReservationId) ?? null,
    [reservations, selectedReservationId],
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

  function openReservationDrawer(reservation: Reservation) {
    setSelectedReservationId(reservation.id);
    setDraft(createDraft(reservation));
    setDrawerError(null);
  }

  function closeReservationDrawer() {
    setSelectedReservationId(null);
    setDraft(null);
    setDrawerError(null);
  }

  async function createManualReservation(entry: ManualEntryForm) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const nextReservation: Reservation = {
      id: `manual_${Date.now()}`,
      roomId: entry.roomId,
      checkIn: entry.checkIn,
      checkOut: entry.checkOut,
      status: entry.entryType === 'manual_reservation' ? 'confirmed' : 'blocked',
      otaSource: 'manual',
      channelReference: entry.entryType === 'manual_reservation' ? 'MANUAL-RES' : 'MANUAL-BLOCK',
      amount: entry.entryType === 'manual_reservation' ? 980 : 0,
      currency: 'BRL',
      customer: {
        name: entry.note.trim() || (entry.entryType === 'manual_reservation' ? 'Reserva manual' : 'Bloqueio operacional'),
        email: entry.entryType === 'manual_reservation' ? 'recepcao@empresa-sancho.com' : 'ops@empresa-sancho.com',
        phone: '+55 81 3000-0000',
      },
      notes: entry.note.trim() || 'Lançamento manual criado pela equipe operacional.',
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
      showToast('Lançamento manual criado com sucesso.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReservationUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft) {
      return;
    }

    if (!draft.customerName || !draft.checkIn || !draft.checkOut || !draft.currency) {
      setDrawerError('Preencha os campos obrigatórios do formulário.');
      return;
    }

    if (draft.checkOut <= draft.checkIn) {
      setDrawerError('A data de check-out precisa ser posterior ao check-in.');
      return;
    }

    const amount = parseCurrencyInput(draft.amount);

    if (Number.isNaN(amount) || amount < 0) {
      setDrawerError('Informe um valor numérico válido para a reserva.');
      return;
    }

    setDrawerError(null);
    setIsUpdatingReservation(true);

    try {
      const updatedReservation: Reservation = {
        id: draft.id,
        roomId: draft.roomId,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        status: draft.status,
        otaSource: draft.otaSource,
        channelReference: draft.channelReference,
        amount,
        currency: draft.currency,
        customer: {
          name: draft.customerName,
          email: draft.customerEmail,
          phone: draft.customerPhone,
        },
        notes: draft.notes,
      };

      const savedReservation = await updateReservation(updatedReservation);
      setReservations((current) =>
        current.map((reservation) => (reservation.id === savedReservation.id ? savedReservation : reservation)),
      );
      if (savedReservation.status === 'cancelled') {
        closeReservationDrawer();
        showToast('Reserva cancelada e removida da grade do calendário.');
        return;
      }

      setDraft(createDraft(savedReservation));
      showToast('Reserva atualizada com sucesso.');
    } finally {
      setIsUpdatingReservation(false);
    }
  }

  function shiftTimeline(direction: 'previous' | 'next') {
    setGridStart((current) => addDays(current, direction === 'next' ? 7 : -7));
  }

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[30px] border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Calendário operacional</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Disponibilidade com visual de PMS moderno</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Acompanhe a ocupação, visualize mais períodos no tempo e modere reservas em contexto sem sair da grade.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => openManualEntryModal()}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30"
              >
                <CalendarPlus2 className="h-4 w-4" />
                Novo lançamento
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

        <section className="grid gap-4 xl:grid-cols-3">
          {[
            {
              label: 'Quartos ativos',
              value: activeRooms.length,
              icon: BedDouble,
              tone: 'text-sky-300 bg-sky-400/10 border-sky-400/20',
            },
            {
              label: 'Lançamentos manuais',
              value: manualEntriesCount,
              icon: MoonStar,
              tone: 'text-violet-200 bg-violet-400/10 border-violet-400/20',
            },
            {
              label: 'Receita em reservas',
              value: formatCurrency(confirmedRevenue),
              icon: Receipt,
              tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${card.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                {card.label === 'Receita em reservas' ? (
                  <p className="mt-4 text-sm text-slate-400">Inclui todas as reservas monetizadas presentes no período carregado.</p>
                ) : null}
                {card.label === 'Quartos ativos' ? (
                  <p className="mt-4 text-sm text-slate-400">{occupancy}% de ocupação visível na janela de {days.length} dias.</p>
                ) : null}
                {card.label === 'Lançamentos manuais' ? (
                  <p className="mt-4 text-sm text-slate-400">Bloqueios e reservas criados diretamente pela equipe.</p>
                ) : null}
              </div>
            );
          })}
        </section>

        <section className="rounded-[30px] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-3 py-2 text-xs font-medium uppercase tracking-[0.28em] text-slate-300">
                <Sparkles className="h-4 w-4 text-sky-300" />
                Grade unificada
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">Calendário por acomodação</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Clique em uma reserva para editar. Clique em um espaço vazio para criar um lançamento manual.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <div className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-2">
                {days.length} dias visíveis
              </div>
              <div className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-2">Reservas canceladas ficam ocultas na grade</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-slate-950/50 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-300">
                <CalendarDays className="h-4 w-4 text-sky-300" />
                {formatLongDate(days[0].toISOString().slice(0, 10))} até {formatLongDate(days[days.length - 1].toISOString().slice(0, 10))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => shiftTimeline('previous')}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-slate-200 transition hover:border-white/20"
                  aria-label="Ver período anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGridStart(GRID_START)}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20"
                >
                  Hoje
                </button>
                <button
                  onClick={() => shiftTimeline('next')}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-slate-200 transition hover:border-white/20"
                  aria-label="Ver próximo período"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {DAY_RANGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setDaysVisible(option)}
                  className={cn(
                    'rounded-2xl border px-4 py-3 text-sm font-medium transition',
                    daysVisible === option
                      ? 'border-sky-400/40 bg-sky-500/10 text-sky-200'
                      : 'border-white/10 bg-slate-900/80 text-slate-300 hover:border-white/20',
                  )}
                >
                  {option} dias
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="space-y-4" style={{ minWidth: `${260 + days.length * 108}px` }}>
              <div className="grid gap-3" style={{ gridTemplateColumns: `260px repeat(${days.length}, minmax(96px, 1fr))` }}>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm font-medium text-slate-300">
                  Acomodações
                </div>
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-4 text-center"
                  >
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">{formatDateLabel(day)}</p>
                  </div>
                ))}
              </div>

              {rooms.map((room) => {
                const roomReservations = visibleReservations.filter((reservation) => reservation.roomId === room.id);

                return (
                  <div
                    key={room.id}
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `260px repeat(${days.length}, minmax(96px, 1fr))` }}
                  >
                    <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{room.name}</p>
                          <p className="mt-2 text-sm text-slate-400">{room.maxGuests} hóspedes</p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium',
                            room.status === 'active'
                              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                              : 'border-amber-400/20 bg-amber-400/10 text-amber-200',
                          )}
                        >
                          {room.status === 'active' ? 'Ativo' : 'Manutenção'}
                        </span>
                      </div>
                    </div>

                    <div
                      className="relative grid h-[120px] gap-3 rounded-[24px] border border-white/10 bg-slate-950/50 p-3"
                      style={{
                        gridColumn: `span ${days.length} / span ${days.length}`,
                        gridTemplateColumns: `repeat(${days.length}, minmax(96px, 1fr))`,
                      }}
                    >
                      {days.map((day) => (
                        <button
                          key={`${room.id}-${day.toISOString()}`}
                          onClick={() => openManualEntryModal(room.id, day)}
                          className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] transition hover:border-sky-300/40 hover:bg-sky-400/5"
                          aria-label={`Criar lançamento para ${room.name} em ${formatDateLabel(day)}`}
                        />
                      ))}

                      {roomReservations.map((reservation) => {
                        const startOffset = differenceInDays(gridStart, new Date(`${reservation.checkIn}T00:00:00`)) - 1;
                        const duration = differenceInDays(
                          new Date(`${reservation.checkIn}T00:00:00`),
                          new Date(`${reservation.checkOut}T00:00:00`),
                        );
                        const visibleDuration = Math.min(duration, daysVisible - Math.max(0, startOffset));

                        if (visibleDuration <= 0) {
                          return null;
                        }

                        return (
                          <motion.button
                            key={reservation.id}
                            layout
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => openReservationDrawer(reservation)}
                            className={cn(
                              'absolute top-3 flex h-[96px] flex-col justify-between rounded-[20px] border border-black/10 px-4 py-3 text-left shadow-lg shadow-slate-950/25',
                              OTA_STYLES[reservation.otaSource],
                            )}
                            style={{
                              left: `calc(${Math.max(0, startOffset)} * (100% / ${daysVisible}) + ${Math.max(0, startOffset)} * 0.75rem + 0.75rem)`,
                              width: `calc(${visibleDuration} * (100% / ${daysVisible}) + ${Math.max(visibleDuration - 1, 0)} * 0.75rem - 0.75rem)`,
                            }}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] opacity-80">
                                  {OTA_LABELS[reservation.otaSource]}
                                </p>
                                <span className="text-[11px] opacity-85">{STATUS_LABELS[reservation.status]}</span>
                              </div>
                              <p className="mt-3 text-sm font-semibold">{reservation.customer.name}</p>
                              <p className="mt-1 text-xs opacity-90">{formatCurrency(reservation.amount, reservation.currency)}</p>
                            </div>
                            <div className="flex items-center justify-between text-[11px] opacity-85">
                              <span>{reservation.channelReference}</span>
                              <span>
                                {reservation.checkIn.slice(5)} → {reservation.checkOut.slice(5)}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="w-full max-w-2xl rounded-[30px] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-200">Lançamento manual</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">Adicionar reserva ou bloqueio</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Registre períodos ocupados, manutenção ou reservas criadas diretamente pela sua equipe.
                  </p>
                </div>
                <button
                  onClick={closeManualEntryModal}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleManualEntrySubmit} className="mt-8 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Quarto</span>
                    <select
                      value={manualForm.roomId}
                      onChange={(event) => setManualForm((current) => ({ ...current, roomId: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    >
                      {activeRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Tipo</span>
                    <select
                      value={manualForm.entryType}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          entryType: event.target.value as ManualEntryForm['entryType'],
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="manual_reservation">Reserva manual</option>
                      <option value="blocked">Bloqueio operacional</option>
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
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Check-out</span>
                    <input
                      type="date"
                      value={manualForm.checkOut}
                      onChange={(event) => setManualForm((current) => ({ ...current, checkOut: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
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
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>

                {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeManualEntryModal}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-3 text-sm font-medium text-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedReservation && draft ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeReservationDrawer}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Moderação de reserva</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{selectedReservation.customer.name}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', STATUS_STYLES[selectedReservation.status])}>
                      {STATUS_LABELS[selectedReservation.status]}
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-medium text-slate-300">
                      {OTA_LABELS[selectedReservation.otaSource]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeReservationDrawer}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  {
                    label: 'Estadia',
                    value: `${formatLongDate(selectedReservation.checkIn)} → ${formatLongDate(selectedReservation.checkOut)}`,
                    icon: CalendarClock,
                  },
                  {
                    label: 'Valor',
                    value: formatCurrency(selectedReservation.amount, selectedReservation.currency),
                    icon: Receipt,
                  },
                  {
                    label: 'Contato',
                    value: selectedReservation.customer.email || 'Sem email informado',
                    icon: Mail,
                  },
                  {
                    label: 'Telefone',
                    value: selectedReservation.customer.phone || 'Sem telefone informado',
                    icon: Phone,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-[24px] border border-white/10 bg-slate-950/50 p-4">
                      <div className="flex items-center gap-3 text-slate-300">
                        <div className="rounded-2xl border border-white/10 bg-slate-900 p-3">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{item.label}</p>
                          <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleReservationUpdate} className="mt-6 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                      <UserRound className="h-4 w-4 text-sky-300" />
                      Nome do hóspede
                    </span>
                    <input
                      type="text"
                      value={draft.customerName}
                      onChange={(event) => setDraft((current) => (current ? { ...current, customerName: event.target.value } : current))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                      <Mail className="h-4 w-4 text-sky-300" />
                      Email
                    </span>
                    <input
                      type="email"
                      value={draft.customerEmail}
                      onChange={(event) => setDraft((current) => (current ? { ...current, customerEmail: event.target.value } : current))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                      <Phone className="h-4 w-4 text-sky-300" />
                      Telefone
                    </span>
                    <input
                      type="text"
                      value={draft.customerPhone}
                      onChange={(event) => setDraft((current) => (current ? { ...current, customerPhone: event.target.value } : current))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Status</span>
                    <select
                      value={draft.status}
                      onChange={(event) =>
                        setDraft((current) =>
                          current ? { ...current, status: event.target.value as ReservationStatus } : current,
                        )
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Check-in</span>
                    <input
                      type="date"
                      value={draft.checkIn}
                      onChange={(event) => setDraft((current) => (current ? { ...current, checkIn: event.target.value } : current))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Check-out</span>
                    <input
                      type="date"
                      value={draft.checkOut}
                      onChange={(event) => setDraft((current) => (current ? { ...current, checkOut: event.target.value } : current))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-[1fr_160px]">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Valor</span>
                    <input
                      type="text"
                      value={draft.amount}
                      onChange={(event) =>
                        setDraft((current) =>
                          current ? { ...current, amount: formatCurrencyInput(event.target.value, current.currency) } : current,
                        )
                      }
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Moeda</span>
                    <input
                      type="text"
                      value={draft.currency}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                currency: event.target.value.toUpperCase(),
                                amount: formatCurrencyInput(current.amount, event.target.value.toUpperCase() || 'BRL'),
                              }
                            : current,
                        )
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm uppercase text-white outline-none"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Referência do canal</span>
                  <input
                    type="text"
                    value={draft.channelReference}
                    onChange={(event) => setDraft((current) => (current ? { ...current, channelReference: event.target.value } : current))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                    <ScrollText className="h-4 w-4 text-sky-300" />
                    Observações
                  </span>
                  <textarea
                    value={draft.notes}
                    onChange={(event) => setDraft((current) => (current ? { ...current, notes: event.target.value } : current))}
                    rows={5}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>

                {drawerError ? <p className="text-sm text-rose-300">{drawerError}</p> : null}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    Moderação inline
                  </div>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={closeReservationDrawer}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-3 text-sm font-medium text-slate-100"
                    >
                      Fechar
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingReservation}
                      className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isUpdatingReservation ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
