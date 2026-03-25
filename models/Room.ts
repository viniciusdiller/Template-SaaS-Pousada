import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export type RoomAttributes = {
  id: number;
  localRoomId: string;
  channexRoomTypeId: string;
  name: string;
  maxGuests: number;
  status: "active" | "maintenance";
  createdAt?: Date;
  updatedAt?: Date;
};

export type RoomCreationAttributes = Optional<
  RoomAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export class Room
  extends Model<RoomAttributes, RoomCreationAttributes>
  implements RoomAttributes
{
  declare id: number;
  declare localRoomId: string;
  declare channexRoomTypeId: string;
  declare name: string;
  declare maxGuests: number;
  declare status: "active" | "maintenance";
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
