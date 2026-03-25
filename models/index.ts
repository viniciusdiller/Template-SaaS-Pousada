import "mysql2";
import mysql from "mysql2";
import { Sequelize } from "sequelize";
import { Reservation } from "@/models/Reservation";
import { Room } from "@/models/Room";
import { User } from "@/models/User";

export { Reservation, Room, User };

export function createSequelizeClient() {
  return new Sequelize({
    dialect: "mysql",
    dialectModule: mysql as any,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
  });
}

export function initializeModels(sequelize: Sequelize) {
  // Initialize models
  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "password_hash",
      },
      role: {
        type: DataTypes.ENUM("owner", "staff"),
        allowNull: false,
        defaultValue: "staff",
      },
      permissions: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "[]",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      sequelize,
      tableName: "users",
      modelName: "User",
    },
  );

  Room.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      localRoomId: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: true,
        field: "local_room_id",
      },
      channexRoomTypeId: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
        field: "channex_room_type_id",
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      maxGuests: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "max_guests",
      },
      status: {
        type: DataTypes.ENUM("active", "maintenance"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      sequelize,
      tableName: "rooms",
      modelName: "Room",
    },
  );

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

  Room.hasMany(Reservation, {
    foreignKey: "roomId",
    as: "reservations",
  });

  Reservation.belongsTo(Room, {
    foreignKey: "roomId",
    as: "room",
  });


  return {
    sequelize,
    User,
    Room,
    Reservation,
  };
}
