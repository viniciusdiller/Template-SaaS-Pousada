import { Sequelize } from 'sequelize';
import { Reservation } from '@/models/Reservation';
import { Room } from '@/models/Room';
import { User } from '@/models/User';

export function createSequelizeClient() {
  return new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME ?? 'channel_manager',
    username: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    logging: false,
  });
}

export function initializeModels(sequelize: Sequelize) {
  User.initialize(sequelize);
  Room.initialize(sequelize);
  Reservation.initialize(sequelize);

  Room.hasMany(Reservation, {
    foreignKey: 'roomId',
    as: 'reservations',
  });

  Reservation.associate();

  return {
    sequelize,
    User,
    Room,
    Reservation,
  };
}
