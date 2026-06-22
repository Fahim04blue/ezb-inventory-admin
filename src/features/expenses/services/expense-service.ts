import { prisma } from "@/lib/prisma";
import type { ExpenseInput } from "../schemas/expense-schemas";
import { type ExpenseView } from "../types/expense.types";

export class ExpenseServiceError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = "ExpenseServiceError";
  }
}

function mapToView(expense: any): ExpenseView {
  return {
    id: expense.id,
    date: expense.date.toISOString(),
    category: expense.category,
    title: expense.title,
    amountBdt: expense.amountBdt.toString(),
    paymentMethod: expense.paymentMethod,
    relatedPurchaseId: expense.relatedPurchaseId,
    relatedOrderId: expense.relatedOrderId,
    notes: expense.notes,
    isActive: expense.isActive,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

export async function getExpenses(): Promise<ExpenseView[]> {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
  });

  return expenses.map(mapToView);
}

export async function getExpenseById(id: number): Promise<ExpenseView | null> {
  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  return expense ? mapToView(expense) : null;
}

export async function createExpense(
  data: ExpenseInput,
  user: { id: number }
): Promise<ExpenseView> {
  const expense = await prisma.expense.create({
    data: {
      ...data,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  return mapToView(expense);
}

export async function updateExpense(
  id: number,
  data: ExpenseInput,
  user: { id: number }
): Promise<ExpenseView> {
  const existing = await prisma.expense.findUnique({ where: { id } });

  if (!existing) {
    throw new ExpenseServiceError("Expense not found", 404);
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...data,
      updatedById: user.id,
    },
  });

  return mapToView(expense);
}

export async function updateExpenseStatus(
  id: number,
  data: { isActive: boolean },
  user: { id: number }
): Promise<ExpenseView> {
  const existing = await prisma.expense.findUnique({ where: { id } });

  if (!existing) {
    throw new ExpenseServiceError("Expense not found", 404);
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      isActive: data.isActive,
      updatedById: user.id,
    },
  });

  return mapToView(expense);
}
