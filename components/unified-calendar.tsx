'use client';

import { motion } from 'framer-motion';
import { BedDouble, CalendarRange, LogOut, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CalendarSkeleton } from '@/components/calendar-skeleton';
import { useToast } from '@/components/toast-provider';
import { addDays, cn, differenceInDays, formatDateLabel } from '@/lib/utils';
import { getReservations, getRooms } from '@/services/channexService';
import type { OtaSource, Reservation, Room } from '@/types/channex';

const OTA_STYLES: Record<OtaSource, string> = {
  booking: 'bg-booking/85 text-white',
  expedia: 'bg-expedia/85 text-slate-950',
  hotels_com: 'bg-hotels/85 text-white',
};

const OTA_LABELS: Record<OtaSource, string> = {
  booking: 'Booking.com',
  expedia: 'Expedia',
  hotels_com: 'Hoteis.com',
};

const DAYS_VISIBLE = 10;
const GRID_START = new Date('2026-03-23T00:00:00');

export function UnifiedCalendar() {
  const router = useRouter();
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  function handleBlockDate(roomName: string, dateLabel: string) {
    showToast(`Data bloqueada em ${roomName} para ${dateLabel}.`);
  }

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-[28px] p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Calendário Unificado</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Disponibilidade consolidada da pousada</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Estrutura preparada para consumir o Channex.io no backend, mantendo a UI desacoplada via serviço mockado.
              </p>
            </div>
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel rounded-[28px] p-6"
        >
          <div className="flex items-center gap-3 text-sky-200">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm uppercase tracking-[0.3em]">KPIs do MVP</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Quartos monitorados</p>
              <p className="mt-2 text-3xl font-semibold text-white">{rooms.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Reservas sincronizadas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{reservations.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="glass-panel overflow-x-auto rounded-[28px] p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <CalendarRange className="h-4 w-4 text-sky-300" />
            Janela operacional de {days.length} dias
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <BedDouble className="h-4 w-4 text-emerald" />
            Prevenção de overbooking por quarto
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
                      <span className={cn('rounded-full px-2 py-1 text-xs', room.status === 'active' ? 'bg-emerald/15 text-emerald' : 'bg-amber-400/15 text-amber-300')}>
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
                        onClick={() => handleBlockDate(room.name, formatDateLabel(day))}
                        className="h-24 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-left"
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
                            <span>{reservation.status}</span>
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
  );
}
