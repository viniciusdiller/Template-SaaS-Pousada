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

let reservations: Reservation[] = [
  {
    id: 'res_001',
    roomId: 'room-master-01',
    checkIn: '2026-03-23',
    checkOut: '2026-03-26',
    status: 'confirmed',
    otaSource: 'booking',
    channelReference: 'BK-483920',
    amount: 2780,
    currency: 'BRL',
    customer: {
      name: 'Marina Carvalho',
      email: 'marina.carvalho@email.com',
      phone: '+55 11 99888-1020',
    },
    notes: 'Chegada prevista às 15h30. Solicita quarto silencioso e berço disponível no check-in.',
  },
  {
    id: 'res_002',
    roomId: 'room-master-01',
    checkIn: '2026-03-27',
    checkOut: '2026-03-30',
    status: 'pending',
    otaSource: 'expedia',
    channelReference: 'EX-219301',
    amount: 2410,
    currency: 'BRL',
    customer: {
      name: 'Paulo Mendes',
      email: 'paulo.mendes@email.com',
      phone: '+55 21 99771-1188',
    },
    notes: 'Reserva com pagamento pendente. Confirmar preferência por cama extra.',
  },
  {
    id: 'res_003',
    roomId: 'room-bangalo-02',
    checkIn: '2026-03-24',
    checkOut: '2026-03-29',
    status: 'confirmed',
    otaSource: 'hotels_com',
    channelReference: 'HT-772045',
    amount: 3890,
    currency: 'BRL',
    customer: {
      name: 'Laura Silveira',
      email: 'laura.silveira@email.com',
      phone: '+55 31 98822-7412',
    },
    notes: 'Hóspede VIP com pedido de amenities premium e late check-out sujeito à disponibilidade.',
  },
  {
    id: 'res_004',
    roomId: 'room-deluxe-03',
    checkIn: '2026-03-25',
    checkOut: '2026-03-27',
    status: 'blocked',
    otaSource: 'manual',
    channelReference: 'OPS-BLOCK-03',
    amount: 0,
    currency: 'BRL',
    customer: {
      name: 'Bloqueio Operacional',
      email: 'ops@empresa-sancho.com',
      phone: '+55 81 3000-0003',
    },
    notes: 'Bloqueio para vistoria elétrica e revisão do ar-condicionado.',
  },
  {
    id: 'res_005',
    roomId: 'room-standard-04',
    checkIn: '2026-03-23',
    checkOut: '2026-03-31',
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
    notes: 'Interdição temporária para pintura e troca de enxoval.',
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

export async function getUnifiedInventory() {
  const [roomList, reservationList, expenseList] = await Promise.all([
    getRooms(),
    getReservations(),
    getExpenses(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    rooms: roomList,
    reservations: reservationList,
    expenses: expenseList,
  };
}
