import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";

export const expenseSchema = z.object({
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  category: z.nativeEnum(ExpenseCategory),
  title: z.string().min(1, "Title is required"),
  amountBdt: z.string().min(1, "Amount is required"),
  paymentMethod: z.string().nullable().optional(),
  relatedPurchaseId: z.number().nullable().optional(),
  relatedOrderId: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const updateExpenseStatusSchema = z.object({
  isActive: z.boolean(),
});
