export type OtaSource = 'booking' | 'expedia' | 'hotels_com';

export type Room = {
  id: string;
  channexRoomTypeId: string;
  name: string;
  maxGuests: number;
  status: 'active' | 'maintenance';
};

export type ReservationStatus = 'confirmed' | 'pending' | 'cancelled' | 'blocked';

export type Reservation = {
  id: string;
  roomId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  otaSource: OtaSource;
  channelReference: string;
};
