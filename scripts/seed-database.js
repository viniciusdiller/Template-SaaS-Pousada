const { Sequelize, DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");

// User Model
class User extends Model {}

function initializeUserModel(sequelize) {
  return User.init(
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
}

async function seedDatabase() {
  const sequelize = new Sequelize({
    dialect: "mysql",
    host: "localhost",
    port: 3306,
    database: "template",
    username: "root",
    password: "vinicius",
    logging: (msg) => console.log("📝 SQL:", msg),
  });

  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database");

    const User = initializeUserModel(sequelize);

    // Sync tables
    await sequelize.sync({ alter: true });
    console.log("✅ Tables synchronized");

    // Check if users exist
    const userCount = await User.count();
    if (userCount > 0) {
      console.log(`✅ Database already seeded with ${userCount} users`);
      await sequelize.close();
      process.exit(0);
    }

    console.log("🌱 Seeding initial users...");

    // Create admin user
    const adminPasswordHash = await bcrypt.hash("sancho123", 10);
    await User.create({
      name: "Administrador",
      email: "admin@pousadasancho.com",
      passwordHash: adminPasswordHash,
      role: "owner",
      permissions: JSON.stringify(["calendar", "finance", "checkin", "team"]),
      isActive: true,
    });
    console.log("✅ Created admin user");

    // Create staff user 1
    const staff1PasswordHash = await bcrypt.hash("equipe123", 10);
    await User.create({
      name: "Camila Recepção",
      email: "camila.recepcao@pousadasancho.com",
      passwordHash: staff1PasswordHash,
      role: "staff",
      permissions: JSON.stringify(["calendar", "checkin"]),
      isActive: true,
    });
    console.log("✅ Created staff user 1");

    // Create staff user 2
    const staff2PasswordHash = await bcrypt.hash("manutencao123", 10);
    await User.create({
      name: "João Manutenção",
      email: "joao.manutencao@pousadasancho.com",
      passwordHash: staff2PasswordHash,
      role: "staff",
      permissions: JSON.stringify(["calendar"]),
      isActive: true,
    });
    console.log("✅ Created staff user 2");

    // Verify
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role"],
    });
    console.log("\n✅ All users created:");
    users.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });

    await sequelize.close();
    console.log("\n✅ Database seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
