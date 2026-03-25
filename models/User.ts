import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export type UserAttributes = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: "owner" | "staff";
  permissions: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserCreationAttributes = Optional<
  UserAttributes,
  "id" | "createdAt" | "updatedAt" | "isActive"
>;

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: number;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare role: "owner" | "staff";
  declare permissions: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static initModel(sequelize: Sequelize) {
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

    return User;
  }

  static initialize(sequelize: Sequelize) {
    return User.initModel(sequelize);
  }
}
