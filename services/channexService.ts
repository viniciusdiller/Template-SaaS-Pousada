import type { Expense, Reservation, Room } from '@/types/channex';

const rooms: Room[] = [
  {
    id: 'room-master-01',
    channexRoomTypeId: 'chx_rm_001',
    name: 'Suíte Master Vista Mar',
    maxGuests: 3,
    status: 'active',
  },
  {
    id: 'room-bangalo-02',
    channexRoomTypeId: 'chx_rm_002',
    name: 'Bangalô Jardim',
    maxGuests: 4,
    status: 'active',
  },
  {
    id: 'room-deluxe-03',
    channexRoomTypeId: 'chx_rm_003',
    name: 'Quarto Deluxe Piscina',
    maxGuests: 2,
    status: 'active',
  },
  {
    id: 'room-standard-04',
    channexRoomTypeId: 'chx_rm_004',
    name: 'Quarto Standard',
    maxGuests: 2,
    status: 'maintenance',
  },
];

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(baseDate: Date, days: number) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

const today = new Date();
const yesterday = addDays(today, -1);
const tomorrow = addDays(today, 1);
const inTwoDays = addDays(today, 2);

let reservations: Reservation[] = [
  {
    id: 'res_001',
    roomId: 'room-master-01',
    checkIn: formatDateOnly(today),
    checkOut: formatDateOnly(inTwoDays),
    status: 'confirmed',
    otaSource: 'booking',
    channelReference: 'BK-483920-A',
    amount: 2780,
    currency: 'BRL',
    customer: {
      name: 'Hospede Exemplo 01',
      email: 'hospede01@email.com',
      phone: '+55 11 99888-1020',
    },
    notes: 'Dado generico para demonstracao de check-in.',
    checkedInAt: null,
    checkedOutAt: null,
  },
  {
    id: 'res_002',
    roomId: 'room-bangalo-02',
    checkIn: formatDateOnly(today),
    checkOut: formatDateOnly(tomorrow),
    status: 'confirmed',
    otaSource: 'expedia',
    channelReference: 'EX-219301-B',
    amount: 2410,
    currency: 'BRL',
    customer: {
      name: 'Hospede Exemplo 02',
      email: 'hospede02@email.com',
      phone: '+55 21 99771-1188',
    },
    notes: 'Reserva de exemplo para equipe de recepcao.',
    checkedInAt: null,
    checkedOutAt: null,
  },
  {
    id: 'res_003',
    roomId: 'room-deluxe-03',
    checkIn: formatDateOnly(yesterday),
    checkOut: formatDateOnly(today),
    status: 'confirmed',
    otaSource: 'hotels_com',
    channelReference: 'HT-772045-C',
    amount: 1940,
    currency: 'BRL',
    customer: {
      name: 'Hospede Exemplo 03',
      email: 'hospede03@email.com',
      phone: '+55 31 98822-7412',
    },
    notes: 'Exemplo com check-in ja realizado aguardando check-out.',
    checkedInAt: addDays(today, -1).toISOString(),
    checkedOutAt: null,
  },
  {
    id: 'res_004',
    roomId: 'room-standard-04',
    checkIn: formatDateOnly(yesterday),
    checkOut: formatDateOnly(today),
    status: 'confirmed',
    otaSource: 'manual',
    channelReference: 'DIR-9001-D',
    amount: 860,
    currency: 'BRL',
    customer: {
      name: 'Hospede Exemplo 04',
      email: 'hospede04@email.com',
      phone: '+55 81 3000-0003',
    },
    notes: 'Check-out pendente para demonstracao operacional.',
    checkedInAt: addDays(today, -1).toISOString(),
    checkedOutAt: null,
  },
  {
    id: 'res_005',
    roomId: 'room-deluxe-03',
    checkIn: formatDateOnly(tomorrow),
    checkOut: formatDateOnly(inTwoDays),
    status: 'blocked',
    otaSource: 'manual',
    channelReference: 'OPS-MAINT-01',
    amount: 0,
    currency: 'BRL',
    customer: {
      name: 'Manutenção Preventiva',
      email: 'manutencao@empresa-sancho.com',
      phone: '+55 81 3000-0004',
    },
    notes: 'Interdicao temporaria para pintura e troca de enxoval.',
    checkedInAt: null,
    checkedOutAt: null,
  },
  {
    id: 'res_006',
    roomId: 'room-master-01',
    checkIn: formatDateOnly(yesterday),
    checkOut: formatDateOnly(tomorrow),
    status: 'pending',
    otaSource: 'booking',
    channelReference: 'BK-7001-E',
    amount: 3180,
    currency: 'BRL',
    customer: {
      name: 'Hospede Exemplo 05',
      email: 'hospede05@email.com',
      phone: '+55 19 99121-4456',
    },
    notes: 'Reserva pendente de confirmacao de pagamento.',
    checkedInAt: null,
    checkedOutAt: null,
  },
];

let expenses: Expense[] = [
  {
    id: 'exp_001',
    description: 'Lavandaria e reposição de enxoval',
    amount: 580,
    date: '2026-03-22',
    category: 'limpeza',
  },
  {
    id: 'exp_002',
    description: 'Manutenção do sistema de climatização',
    amount: 1240,
    date: '2026-03-21',
    category: 'manutenção',
  },
  {
    id: 'exp_003',
    description: 'DARF ISS hospedagem',
    amount: 910,
    date: '2026-03-20',
    category: 'impostos',
  },
  {
    id: 'exp_004',
    description: 'Comissão Booking.com',
    amount: 760,
    date: '2026-03-19',
    category: 'comissões',
  },
];

const API_DELAY_MS = 500;

async function simulateDelay<T>(payload: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, API_DELAY_MS));
  return structuredClone(payload);
}

export async function getRooms(): Promise<Room[]> {
  return simulateDelay(rooms);
}

export async function getReservations(): Promise<Reservation[]> {
  return simulateDelay(reservations);
}

export async function updateReservation(updatedReservation: Reservation): Promise<Reservation> {
  reservations = reservations.map((reservation) =>
    reservation.id === updatedReservation.id ? structuredClone(updatedReservation) : reservation,
  );

  return simulateDelay(updatedReservation);
}

export async function getExpenses(): Promise<Expense[]> {
  return simulateDelay(expenses);
}

export async function createExpense(input: Omit<Expense, 'id'>): Promise<Expense> {
  const nextExpense: Expense = {
    id: `exp_${Date.now()}`,
    ...input,
  };

  expenses = [nextExpense, ...expenses];

  return simulateDelay(nextExpense);
}

export async function getCheckInOutBoard(referenceDate = new Date()) {
  const date = referenceDate.toISOString().slice(0, 10);

  const arrivals = reservations.filter(
    (reservation) => reservation.checkIn === date && reservation.status !== 'cancelled' && reservation.status !== 'blocked',
  );

  const departures = reservations.filter(
    (reservation) => reservation.checkOut === date && reservation.status !== 'cancelled' && reservation.status !== 'blocked',
  );

  return simulateDelay({
    date,
    arrivals,
    departures,
  });
}

export async function registerCheckIn(reservationId: string) {
  const target = reservations.find((reservation) => reservation.id === reservationId);

  if (!target) {
    throw new Error('Reserva nao encontrada.');
  }

  if (target.status === 'cancelled' || target.status === 'blocked') {
    throw new Error('Esta reserva nao pode receber check-in.');
  }

  target.checkedInAt = new Date().toISOString();

  return simulateDelay(structuredClone(target));
}

export async function registerCheckOut(reservationId: string) {
  const target = reservations.find((reservation) => reservation.id === reservationId);

  if (!target) {
    throw new Error('Reserva nao encontrada.');
  }

  if (!target.checkedInAt) {
    throw new Error('Nao e possivel fazer check-out antes do check-in.');
  }

  target.checkedOutAt = new Date().toISOString();

  return simulateDelay(structuredClone(target));
}

export async function getUnifiedInventory() {
  const [roomList, reservationList, expenseList] = await Promise.all([getRooms(), getReservations(), getExpenses()]);

  return {
    generatedAt: new Date().toISOString(),
    rooms: roomList,
    reservations: reservationList,
    expenses: expenseList,
  };
}
