import { Op } from "sequelize";
import { getDatabase } from "@/lib/database";
import type { Expense, Reservation, Room } from "@/types/channex";

export async function getRooms(): Promise<Room[]> {
  const db = await getDatabase();
  const roomRecords = await db.Room.findAll({ order: [["name", "ASC"]] });

  return roomRecords.map((room) => ({
    id: room.localRoomId,
    channexRoomTypeId: room.channexRoomTypeId,
    name: room.name,
    maxGuests: room.maxGuests,
    status: room.status,
  }));
}

export async function getReservations(): Promise<Reservation[]> {
  const db = await getDatabase();
  const reservationRecords = (await db.Reservation.findAll({
    include: [{ model: db.Room, as: "room" }],
    order: [["checkIn", "ASC"]],
  })) as any[];

  return reservationRecords.map((reservation) => ({
    id: reservation.id.toString(),
    roomId: reservation.room?.localRoomId || "",
    checkIn: reservation.checkIn.toISOString().slice(0, 10),
    checkOut: reservation.checkOut.toISOString().slice(0, 10),
    status: reservation.status,
    otaSource: reservation.otaSource,
    channelReference: reservation.channexReservationId,
    amount: reservation.amount || 0,
    currency: reservation.currency || "BRL",
    customer: {
      name: reservation.guestName,
      email: reservation.guestEmail || "",
      phone: reservation.guestPhone || "",
    },
    notes: reservation.notes || "",
    checkedInAt: reservation.checkedInAt?.toISOString() || null,
    checkedOutAt: reservation.checkedOutAt?.toISOString() || null,
  }));
}

export async function updateReservation(
  updatedReservation: Reservation,
): Promise<Reservation> {
  const db = await getDatabase();
  const reservationRecord = await db.Reservation.findByPk(
    parseInt(updatedReservation.id, 10),
  );

  if (!reservationRecord) throw new Error("Reservation not found");

  const room = await db.Room.findOne({
    where: { localRoomId: updatedReservation.roomId },
  });

  if (!room) throw new Error("Room not found");

  await reservationRecord.update({
    roomId: room.id,
    status: updatedReservation.status,
    amount: updatedReservation.amount,
    currency: updatedReservation.currency,
    notes: updatedReservation.notes,
    checkedInAt: updatedReservation.checkedInAt
      ? new Date(updatedReservation.checkedInAt)
      : null,
    checkedOutAt: updatedReservation.checkedOutAt
      ? new Date(updatedReservation.checkedOutAt)
      : null,
  });

  return updatedReservation;
}

export async function getExpenses(): Promise<Expense[]> {
  return [];
}

let expenses: Expense[] = [];

export async function createExpense(
  input: Omit<Expense, "id">,
): Promise<Expense> {
  const nextExpense: Expense = {
    id: `exp_${Date.now()}`,
    ...input,
  };

  expenses = [nextExpense, ...expenses];
  return nextExpense;
}

export async function getCheckInOutBoard(referenceDate = new Date()) {
  const db = await getDatabase();
  const date = referenceDate.toISOString().slice(0, 10);

  const records = (await db.Reservation.findAll({
    where: {
      [Op.or]: [{ checkIn: date }, { checkOut: date }],
      status: { [Op.notIn]: ["cancelled", "blocked"] },
    },
    include: [{ model: db.Room, as: "room" }],
  })) as any[];

  const reservations = records.map((reservation) => ({
    id: reservation.id.toString(),
    roomId: reservation.room?.localRoomId || "",
    checkIn: reservation.checkIn.toISOString().slice(0, 10),
    checkOut: reservation.checkOut.toISOString().slice(0, 10),
    status: reservation.status,
    otaSource: reservation.otaSource,
    channelReference: reservation.channexReservationId,
    amount: reservation.amount || 0,
    currency: reservation.currency || "BRL",
    customer: {
      name: reservation.guestName,
      email: reservation.guestEmail || "",
      phone: reservation.guestPhone || "",
    },
    notes: reservation.notes || "",
    checkedInAt: reservation.checkedInAt?.toISOString() || null,
    checkedOutAt: reservation.checkedOutAt?.toISOString() || null,
  }));

  const arrivals = reservations.filter((reservation) => reservation.checkIn === date);
  const departures = reservations.filter((reservation) => reservation.checkOut === date);

  return {
    date,
    arrivals,
    departures,
  };
}

export async function registerCheckIn(reservationId: string) {
  const db = await getDatabase();
  const target = await db.Reservation.findByPk(parseInt(reservationId, 10));

  if (!target) {
    throw new Error("Reserva nao encontrada.");
  }

  if (target.status === "cancelled" || target.status === "blocked") {
    throw new Error("Esta reserva nao pode receber check-in.");
  }

  await target.update({ checkedInAt: new Date() });
  return target;
}

export async function registerCheckOut(reservationId: string) {
  const db = await getDatabase();
  const target = await db.Reservation.findByPk(parseInt(reservationId, 10));

  if (!target) {
    throw new Error("Reserva nao encontrada.");
  }

  if (!target.checkedInAt) {
    throw new Error("Nao e possivel fazer check-out antes do check-in.");
  }

  await target.update({ checkedOutAt: new Date() });
  return target;
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
