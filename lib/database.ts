import bcrypt from "bcryptjs";
import mysql from "mysql2";
import { Sequelize } from "sequelize";
import {
  createSequelizeClient,
  initializeModels,
  type DatabaseModels,
} from "@/models";

type GlobalDatabaseCache = {
  db: DatabaseModels | null;
  initPromise: Promise<DatabaseModels> | null;
};

const globalForDatabase = globalThis as typeof globalThis & {
  __dbCache?: GlobalDatabaseCache;
};

const cache: GlobalDatabaseCache = globalForDatabase.__dbCache ?? {
  db: null,
  initPromise: null,
};

globalForDatabase.__dbCache = cache;

async function initializeDatabase(): Promise<DatabaseModels> {
  const sequelize = createSequelizeClient();

  const dbName = process.env.DB_NAME || "channel_manager";
  const rootSequelize = new Sequelize({
    dialect: "mysql",
    dialectModule: mysql as any,
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    logging: false,
  });

  try {
    await rootSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  } finally {
    await rootSequelize.close();
  }

  await sequelize.authenticate();

  const db = initializeModels(sequelize);
  await sequelize.sync();
  await seedInitialData(db);

  return db;
}

export async function getDatabase(): Promise<DatabaseModels> {
  if (cache.db) {
    return cache.db;
  }

  if (!cache.initPromise) {
    cache.initPromise = initializeDatabase()
      .then((database) => {
        cache.db = database;
        return database;
      })
      .catch((error) => {
        cache.initPromise = null;
        throw error;
      });
  }

  return cache.initPromise;
}

async function seedInitialData(db: DatabaseModels) {
  const userCount = await db.User.count();
  if (userCount === 0) {
    const adminPasswordHash = await bcrypt.hash("sancho123", 10);
    await db.User.create({
      name: "Administrador",
      email: "admin@pousadasancho.com",
      passwordHash: adminPasswordHash,
      role: "owner",
      permissions: JSON.stringify(["calendar", "finance", "checkin", "team"]),
      isActive: true,
    });

    const staff1PasswordHash = await bcrypt.hash("equipe123", 10);
    await db.User.create({
      name: "Camila Recepção",
      email: "camila.recepcao@pousadasancho.com",
      passwordHash: staff1PasswordHash,
      role: "staff",
      permissions: JSON.stringify(["calendar", "checkin"]),
      isActive: true,
    });

    const staff2PasswordHash = await bcrypt.hash("manutencao123", 10);
    await db.User.create({
      name: "João Manutenção",
      email: "joao.manutencao@pousadasancho.com",
      passwordHash: staff2PasswordHash,
      role: "staff",
      permissions: JSON.stringify(["calendar"]),
      isActive: true,
    });
  }

  const roomCount = await db.Room.count();
  if (roomCount === 0) {
    await db.Room.bulkCreate([
      {
        localRoomId: "SUITE_MASTER",
        channexRoomTypeId: "suite_master",
        name: "Suíte Master",
        maxGuests: 4,
        status: "active",
      },
      {
        localRoomId: "BANGALO_01",
        channexRoomTypeId: "bangalo_01",
        name: "Bangalô 01",
        maxGuests: 3,
        status: "active",
      },
      {
        localRoomId: "STANDARD_01",
        channexRoomTypeId: "standard_01",
        name: "Standard 01",
        maxGuests: 2,
        status: "active",
      },
    ]);
  }
}

export async function closeDatabase() {
  if (cache.db) {
    await cache.db.sequelize.close();
    cache.db = null;
    cache.initPromise = null;
  }
}
