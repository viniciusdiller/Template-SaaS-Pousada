import { DataTypes, Model, Optional, Sequelize } from "sequelize";

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

  static initModel(sequelize: Sequelize) {
    Reservation.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        roomId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "room_id",
          references: {
            model: "rooms",
            key: "id",
          },
        },
        channexReservationId: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          field: "channex_reservation_id",
        },
        otaSource: {
          type: DataTypes.ENUM("booking", "expedia", "hotels_com", "manual"),
          allowNull: false,
          field: "ota_source",
        },
        guestName: {
          type: DataTypes.STRING(140),
          allowNull: false,
          field: "guest_name",
        },
        guestEmail: {
          type: DataTypes.STRING(200),
          allowNull: true,
          field: "guest_email",
        },
        guestPhone: {
          type: DataTypes.STRING(20),
          allowNull: true,
          field: "guest_phone",
        },
        checkIn: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: "check_in",
        },
        checkOut: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: "check_out",
        },
        status: {
          type: DataTypes.ENUM("confirmed", "pending", "cancelled", "blocked"),
          allowNull: false,
          defaultValue: "confirmed",
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          field: "amount",
        },
        currency: {
          type: DataTypes.STRING(3),
          allowNull: true,
          defaultValue: "BRL",
          field: "currency",
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "notes",
        },
        checkedInAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "checked_in_at",
        },
        checkedOutAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "checked_out_at",
        },
      },
      {
        sequelize,
        tableName: "reservations",
        modelName: "Reservation",
      },
    );

    return Reservation;
  }
}
