import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export type ExpenseAttributes = {
  id: number;
  description: string;
  amount: number;
  checkIn: Date;
  checkOut: Date;
  roomId?: string | null;
  category: "limpeza" | "manutenção" | "impostos" | "insumos" | "comissões" | "outros";
  supplier?: string | null;
  paymentMethod?:
    | "cash"
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "pix"
    | "check"
    | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ExpenseCreationAttributes = Optional<
  ExpenseAttributes,
  "id" | "roomId" | "supplier" | "paymentMethod" | "notes" | "createdAt" | "updatedAt"
>;

export class Expense
  extends Model<ExpenseAttributes, ExpenseCreationAttributes>
  implements ExpenseAttributes
{
  declare id: number;
  declare description: string;
  declare amount: number;
  declare checkIn: Date;
  declare checkOut: Date;
  declare roomId?: string | null;
  declare category: ExpenseAttributes["category"];
  declare supplier?: string | null;
  declare paymentMethod?: ExpenseAttributes["paymentMethod"];
  declare notes?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static initModel(sequelize: Sequelize) {
    Expense.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        checkIn: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "check_in",
        },
        checkOut: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "check_out",
        },
        roomId: {
          type: DataTypes.STRING(60),
          allowNull: true,
          field: "room_id",
        },
        category: {
          type: DataTypes.ENUM(
            "limpeza",
            "manutenção",
            "impostos",
            "insumos",
            "comissões",
            "outros",
          ),
          allowNull: false,
        },
        supplier: {
          type: DataTypes.STRING(160),
          allowNull: true,
        },
        paymentMethod: {
          type: DataTypes.ENUM(
            "cash",
            "credit_card",
            "debit_card",
            "bank_transfer",
            "pix",
            "check",
          ),
          allowNull: true,
          field: "payment_method",
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "expenses",
        modelName: "Expense",
      },
    );

    return Expense;
  }
}
