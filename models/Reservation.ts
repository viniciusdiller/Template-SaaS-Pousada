import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Room } from "@/models/Room";

export type ReservationAttributes = {
  id: number;
  roomId: number;
  channexReservationId: string;
  otaSource: "booking" | "expedia" | "hotels_com" | "manual";
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  status: "confirmed" | "pending" | "cancelled" | "blocked";
  amount?: number;
  currency?: string;
  notes?: string;
  checkedInAt?: Date | null;
  checkedOutAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReservationCreationAttributes = Optional<
  ReservationAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export class Reservation
  extends Model<ReservationAttributes, ReservationCreationAttributes>
  implements ReservationAttributes
{
  declare id: number;
  declare roomId: number;
  declare channexReservationId: string;
  declare otaSource: "booking" | "expedia" | "hotels_com" | "manual";
  declare guestName: string;
  declare guestEmail?: string;
  declare guestPhone?: string;
  declare checkIn: Date;
  declare checkOut: Date;
  declare status: "confirmed" | "pending" | "cancelled" | "blocked";
  declare amount?: number;
  declare currency?: string;
  declare notes?: string;
  declare checkedInAt?: Date | null;
  declare checkedOutAt?: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
