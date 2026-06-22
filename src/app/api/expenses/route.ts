import { type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { expenseSchema } from "@/features/expenses/schemas/expense-schemas";
import {
  createExpense,
  getExpenses,
  ExpenseServiceError,
} from "@/features/expenses/services/expense-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const expenses = await getExpenses();
    return successResponse({ expenses }, "Expenses retrieved successfully");
  } catch (error) {
    return errorResponse("Failed to retrieve expenses.", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const body = await request.json();
    const input = expenseSchema.parse(body);
    const expense = await createExpense(input, user);

    return successResponse({ expense }, "Expense created successfully", 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid expense payload.", 400, error.flatten());
    }

    if (error instanceof ExpenseServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to create expense.", 500);
  }
}
