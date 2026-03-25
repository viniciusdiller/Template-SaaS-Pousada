import "mysql2";
import mysql from "mysql2";
import { Sequelize } from "sequelize";
import { Reservation } from "@/models/Reservation";
import { Room } from "@/models/Room";
import { User } from "@/models/User";

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
  User.initialize(sequelize);
  Room.initialize(sequelize);
  Reservation.initialize(sequelize);

  Room.hasMany(Reservation, {
    foreignKey: "roomId",
    as: "reservations",
  });

  Reservation.associate();

  return {
    sequelize,
    User,
    Room,
    Reservation,
  };
}
