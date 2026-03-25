import "mysql2";
import mysql from "mysql2";
import { Sequelize } from "sequelize";
import { Expense } from "@/models/Expense";
import { Reservation } from "@/models/Reservation";
import { Room } from "@/models/Room";
import { User } from "@/models/User";

export { Expense, Reservation, Room, User };

export function createSequelizeClient() {
  return new Sequelize({
    dialect: "mysql",
    dialectModule: mysql as any,
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || "channel_manager",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    logging: false,
  });
}

export function initializeModels(sequelize: Sequelize) {
  User.initModel(sequelize);
  Room.initModel(sequelize);
  Reservation.initModel(sequelize);
  Expense.initModel(sequelize);

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
    Expense,
  };
}

export type DatabaseModels = ReturnType<typeof initializeModels>;
