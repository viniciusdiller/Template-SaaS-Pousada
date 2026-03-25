import { Op } from "sequelize";
import { getDatabase } from "@/lib/database";
import type { Expense, Reservation, Room } from "@/types/channex";

function normalizeDateOnly(value: unknown): string {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    if (value.length >= 10) {
      return value.slice(0, 10);
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return "";
}

function normalizeDateTime(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

function normalizeAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

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
    checkIn: normalizeDateOnly(reservation.checkIn),
    checkOut: normalizeDateOnly(reservation.checkOut),
    status: reservation.status,
    otaSource: reservation.otaSource,
    channelReference: reservation.channexReservationId,
    amount: normalizeAmount(reservation.amount),
    currency: reservation.currency || "BRL",
    customer: {
      name: reservation.guestName,
      email: reservation.guestEmail || "",
      phone: reservation.guestPhone || "",
    },
    notes: reservation.notes || "",
    checkedInAt: normalizeDateTime(reservation.checkedInAt),
    checkedOutAt: normalizeDateTime(reservation.checkedOutAt),
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
  const db = await getDatabase();
  const records = await db.Expense.findAll({ order: [["createdAt", "DESC"]] });

  return records.map((expense) => ({
    id: expense.id.toString(),
    description: expense.description,
    amount: normalizeAmount(expense.amount),
    checkIn: normalizeDateTime(expense.checkIn) || "",
    checkOut: normalizeDateTime(expense.checkOut) || "",
    roomId: expense.roomId || "",
    category: expense.category,
    supplier: expense.supplier || undefined,
    paymentMethod: expense.paymentMethod || undefined,
    notes: expense.notes || undefined,
  }));
}

export async function createExpense(
  input: Omit<Expense, "id">,
): Promise<Expense> {
  const db = await getDatabase();

  const created = await db.Expense.create({
    description: input.description,
    amount: normalizeAmount(input.amount),
    checkIn: new Date(input.checkIn),
    checkOut: new Date(input.checkOut),
    roomId: input.roomId || null,
    category: input.category,
    supplier: input.supplier || null,
    paymentMethod: input.paymentMethod || null,
    notes: input.notes || null,
  });

  return {
    id: created.id.toString(),
    description: created.description,
    amount: normalizeAmount(created.amount),
    checkIn: normalizeDateTime(created.checkIn) || input.checkIn,
    checkOut: normalizeDateTime(created.checkOut) || input.checkOut,
    roomId: created.roomId || "",
    category: created.category,
    supplier: created.supplier || undefined,
    paymentMethod: created.paymentMethod || undefined,
    notes: created.notes || undefined,
  };
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
    checkIn: normalizeDateOnly(reservation.checkIn),
    checkOut: normalizeDateOnly(reservation.checkOut),
    status: reservation.status,
    otaSource: reservation.otaSource,
    channelReference: reservation.channexReservationId,
    amount: normalizeAmount(reservation.amount),
    currency: reservation.currency || "BRL",
    customer: {
      name: reservation.guestName,
      email: reservation.guestEmail || "",
      phone: reservation.guestPhone || "",
    },
    notes: reservation.notes || "",
    checkedInAt: normalizeDateTime(reservation.checkedInAt),
    checkedOutAt: normalizeDateTime(reservation.checkedOutAt),
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
