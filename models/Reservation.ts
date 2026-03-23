import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { Room } from '@/models/Room';

export type ReservationAttributes = {
  id: number;
  roomId: number;
  channexReservationId: string;
  otaSource: 'booking' | 'expedia' | 'hotels_com';
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'blocked';
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReservationCreationAttributes = Optional<ReservationAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Reservation extends Model<ReservationAttributes, ReservationCreationAttributes> implements ReservationAttributes {
  declare id: number;
  declare roomId: number;
  declare channexReservationId: string;
  declare otaSource: 'booking' | 'expedia' | 'hotels_com';
  declare guestName: string;
  declare checkIn: Date;
  declare checkOut: Date;
  declare status: 'confirmed' | 'pending' | 'cancelled' | 'blocked';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static initialize(sequelize: Sequelize) {
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
          field: 'room_id',
          references: {
            model: 'rooms',
            key: 'id',
          },
        },
        channexReservationId: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          field: 'channex_reservation_id',
        },
        otaSource: {
          type: DataTypes.ENUM('booking', 'expedia', 'hotels_com'),
          allowNull: false,
          field: 'ota_source',
        },
        guestName: {
          type: DataTypes.STRING(140),
          allowNull: false,
          field: 'guest_name',
        },
        checkIn: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'check_in',
        },
        checkOut: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'check_out',
        },
        status: {
          type: DataTypes.ENUM('confirmed', 'pending', 'cancelled', 'blocked'),
          allowNull: false,
          defaultValue: 'confirmed',
        },
      },
      {
        sequelize,
        tableName: 'reservations',
        modelName: 'Reservation',
      },
    );
  }

  static associate() {
    Reservation.belongsTo(Room, {
      foreignKey: 'roomId',
      as: 'room',
    });
  }
}
