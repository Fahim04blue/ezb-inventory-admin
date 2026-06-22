import { ExpenseCategory } from "@prisma/client";

export type ExpenseView = {
  id: number;
  date: string;
  category: ExpenseCategory;
  title: string;
  amountBdt: string;
  paymentMethod: string | null;
  relatedPurchaseId: number | null;
  relatedOrderId: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DrawerState = {
  mode: "create" | "edit";
  expense?: ExpenseView;
} | null;

export type ExpenseDateFilter = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH";
export type ExpenseStatusFilter = "ACTIVE" | "INACTIVE" | "ALL";

export type ExpenseFilters = {
  search: string;
  category: ExpenseCategory | "ALL";
  date: ExpenseDateFilter;
  status: ExpenseStatusFilter;
  paymentMethod: string | "ALL";
};
