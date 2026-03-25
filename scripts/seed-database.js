const { Sequelize, DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");

// Room Model
class Room extends Model {}

function initializeRoomModel(sequelize) {
  return Room.init(
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
}

// Reservation Model
class Reservation extends Model {}

function initializeReservationModel(sequelize) {
  return Reservation.init(
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
}

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
    const Room = initializeRoomModel(sequelize);
    const Reservation = initializeReservationModel(sequelize);

    // Set associations
    Reservation.belongsTo(Room, { foreignKey: "roomId", as: "room" });

    // Sync tables
    await sequelize.sync({ alter: true });
    console.log("✅ Tables synchronized");

    // Check if data exists
    const userCount = await User.count();
    const roomCount = await Room.count();
    if (userCount > 0 && roomCount > 0) {
      console.log(
        `✅ Database already seeded with ${userCount} users and ${roomCount} rooms`,
      );
      await sequelize.close();
      process.exit(0);
    }

    console.log("🌱 Seeding rooms...");

    const room1 = await Room.create({
      localRoomId: "room-master-01",
      channexRoomTypeId: "chx_rm_001",
      name: "Suíte Master Vista Mar",
      maxGuests: 3,
      status: "active",
    });

    const room2 = await Room.create({
      localRoomId: "room-bangalo-02",
      channexRoomTypeId: "chx_rm_002",
      name: "Bangalô Jardim",
      maxGuests: 4,
      status: "active",
    });

    const room3 = await Room.create({
      localRoomId: "room-deluxe-03",
      channexRoomTypeId: "chx_rm_003",
      name: "Quarto Deluxe Piscina",
      maxGuests: 2,
      status: "active",
    });

    const room4 = await Room.create({
      localRoomId: "room-standard-04",
      channexRoomTypeId: "chx_rm_004",
      name: "Quarto Standard",
      maxGuests: 2,
      status: "maintenance",
    });

    console.log("✅ Created rooms");

    console.log("🌱 Seeding reservations...");

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const inTwoDays = new Date(today);
    inTwoDays.setDate(today.getDate() + 2);

    await Reservation.create({
      roomId: room1.id,
      channexReservationId: "BK-483920-A",
      otaSource: "booking",
      guestName: "Hospede Exemplo 01",
      guestEmail: "hospede01@email.com",
      guestPhone: "+55 11 99888-1020",
      checkIn: today,
      checkOut: inTwoDays,
      status: "confirmed",
      amount: 2780,
      currency: "BRL",
      notes: "Dado generico para demonstracao de check-in.",
    });

    await Reservation.create({
      roomId: room2.id,
      channexReservationId: "EX-219301-B",
      otaSource: "expedia",
      guestName: "Hospede Exemplo 02",
      guestEmail: "hospede02@email.com",
      guestPhone: "+55 21 99771-1188",
      checkIn: today,
      checkOut: tomorrow,
      status: "confirmed",
      amount: 2410,
      currency: "BRL",
      notes: "Reserva de exemplo para equipe de recepcao.",
    });

    await Reservation.create({
      roomId: room3.id,
      channexReservationId: "HT-772045-C",
      otaSource: "hotels_com",
      guestName: "Hospede Exemplo 03",
      guestEmail: "hospede03@email.com",
      guestPhone: "+55 31 98822-7412",
      checkIn: yesterday,
      checkOut: today,
      status: "confirmed",
      amount: 1940,
      currency: "BRL",
      notes: "Exemplo com check-in ja realizado aguardando check-out.",
      checkedInAt: yesterday,
    });

    await Reservation.create({
      roomId: room4.id,
      channexReservationId: "DIR-9001-D",
      otaSource: "manual",
      guestName: "Hospede Exemplo 04",
      guestEmail: "hospede04@email.com",
      guestPhone: "+55 81 3000-0003",
      checkIn: yesterday,
      checkOut: today,
      status: "confirmed",
      amount: 860,
      currency: "BRL",
      notes: "Check-out pendente para demonstracao operacional.",
      checkedInAt: yesterday,
    });

    await Reservation.create({
      roomId: room3.id,
      channexReservationId: "OPS-MAINT-01",
      otaSource: "manual",
      guestName: "Manutenção Preventiva",
      guestEmail: "manutencao@empresa-sancho.com",
      guestPhone: "+55 81 3000-0004",
      checkIn: tomorrow,
      checkOut: inTwoDays,
      status: "blocked",
      amount: 0,
      currency: "BRL",
      notes: "Interdicao temporaria para pintura e troca de enxoval.",
    });

    await Reservation.create({
      roomId: room1.id,
      channexReservationId: "BK-7001-E",
      otaSource: "booking",
      guestName: "Hospede Exemplo 05",
      guestEmail: "hospede05@email.com",
      guestPhone: "+55 19 99121-4456",
      checkIn: yesterday,
      checkOut: tomorrow,
      status: "pending",
      amount: 3180,
      currency: "BRL",
      notes: "Reserva pendente de confirmacao de pagamento.",
    });

    console.log("✅ Created reservations");

    // Verify
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role"],
    });
    console.log("\n✅ All users created:");
    users.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });

    const rooms = await Room.findAll({
      attributes: ["id", "name", "status"],
    });
    console.log("\n✅ All rooms created:");
    rooms.forEach((room) => {
      console.log(`  - ${room.name} - ${room.status}`);
    });

    const reservations = await Reservation.findAll({
      attributes: ["id", "guestName", "status"],
      include: [{ model: Room, as: "room", attributes: ["name"] }],
    });
    console.log("\n✅ All reservations created:");
    reservations.forEach((res) => {
      console.log(`  - ${res.guestName} in ${res.room?.name} - ${res.status}`);
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
