import { Sequelize } from "sequelize";
import mysql from "mysql2";
import { createSequelizeClient, initializeModels } from "@/models";
import bcrypt from "bcryptjs";

let db: ReturnType<typeof initializeModels> | null = null;

export async function getDatabase() {
  if (!db) {
    const sequelize = createSequelizeClient();

    try {
      // Try to create database if it doesn't exist
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
        await rootSequelize.query(
          `CREATE DATABASE IF NOT EXISTS \`${dbName}\``,
        );
        console.log(`✅ Database '${dbName}' ensured to exist.`);
      } catch (createError) {
        console.warn(
          "⚠️ Could not create database, proceeding anyway:",
          createError.message,
        );
      } finally {
        await rootSequelize.close();
      }

      await sequelize.authenticate();
      console.log("✅ Database connection established successfully.");

      db = initializeModels(sequelize);

      // Sync database (create tables if they don't exist)
      await sequelize.sync({ alter: true });
      console.log("✅ Database synchronized successfully.");

      // Seed initial data
      await seedInitialData(db);
    } catch (error) {
      console.error("❌ Unable to connect to the database:", error);
      throw error;
    }
  }

  return db;
}

async function seedInitialData(db: ReturnType<typeof initializeModels>) {
  try {
    // Check if users already exist
    const userCount = await db.User.count();
    if (userCount > 0) {
      console.log("✅ Initial data already seeded.");
      return;
    }

    console.log("🌱 Seeding initial data...");

    // Create default admin user
    const adminPasswordHash = await bcrypt.hash("sancho123", 10);
    await db.User.create({
      name: "Administrador",
      email: "admin@pousadasancho.com",
      passwordHash: adminPasswordHash,
      role: "owner",
      permissions: JSON.stringify(["calendar", "finance", "checkin", "team"]),
      isActive: true,
    });

    // Create demo staff users
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

    console.log("✅ Initial data seeded successfully.");
  } catch (error) {
    console.error("❌ Error seeding initial data:", error);
  }
}

export async function closeDatabase() {
  if (db) {
    await db.sequelize.close();
    db = null;
  }
}
