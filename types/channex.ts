export type OtaSource = "booking" | "expedia" | "hotels_com" | "manual";

export type Room = {
  id: string;
  channexRoomTypeId: string;
  name: string;
  maxGuests: number;
  status: "active" | "maintenance";
};

export type ReservationStatus =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "blocked";

export type Customer = {
  name: string;
  email: string;
  phone: string;
};

export type Reservation = {
  id: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  otaSource: OtaSource;
  channelReference: string;
  amount: number;
  currency: string;
  customer: Customer;
  notes: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
};

export type ExpenseCategory =
  | "limpeza"
  | "manutenção"
  | "impostos"
  | "insumos"
  | "comissões"
  | "outros";

export type Expense = {
  id: string;
  description: string;
  amount: number;
  checkIn: string;
  checkOut: string;
  roomId: string;
  category: ExpenseCategory;
  supplier?: string;
  paymentMethod?:
    | "cash"
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "pix"
    | "check";
  notes?: string;
};
