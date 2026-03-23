import type { Reservation, Room } from '@/types/channex';

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

const reservations: Reservation[] = [
  {
    id: 'res_001',
    roomId: 'room-master-01',
    guestName: 'Marina Carvalho',
    checkIn: '2026-03-23',
    checkOut: '2026-03-26',
    status: 'confirmed',
    otaSource: 'booking',
    channelReference: 'BK-483920',
  },
  {
    id: 'res_002',
    roomId: 'room-master-01',
    guestName: 'Paulo Mendes',
    checkIn: '2026-03-27',
    checkOut: '2026-03-30',
    status: 'pending',
    otaSource: 'expedia',
    channelReference: 'EX-219301',
  },
  {
    id: 'res_003',
    roomId: 'room-bangalo-02',
    guestName: 'Laura Silveira',
    checkIn: '2026-03-24',
    checkOut: '2026-03-29',
    status: 'confirmed',
    otaSource: 'hotels_com',
    channelReference: 'HT-772045',
  },
  {
    id: 'res_004',
    roomId: 'room-deluxe-03',
    guestName: 'André Lopes',
    checkIn: '2026-03-25',
    checkOut: '2026-03-27',
    status: 'blocked',
    otaSource: 'booking',
    channelReference: 'BK-BLOCK-03',
  },
  {
    id: 'res_005',
    roomId: 'room-standard-04',
    guestName: 'Manutenção Preventiva',
    checkIn: '2026-03-23',
    checkOut: '2026-03-31',
    status: 'blocked',
    otaSource: 'hotels_com',
    channelReference: 'OPS-MAINT-01',
  },
];

const API_DELAY_MS = 1100;

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

export async function getUnifiedInventory() {
  const [roomList, reservationList] = await Promise.all([getRooms(), getReservations()]);

  return {
    generatedAt: new Date().toISOString(),
    rooms: roomList,
    reservations: reservationList,
  };
}
