import { type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { expenseSchema } from "@/features/expenses/schemas/expense-schemas";
import {
  getExpenseById,
  updateExpense,
  ExpenseServiceError,
} from "@/features/expenses/services/expense-service";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return errorResponse("Invalid expense id.", 400);
  }

  try {
    const expense = await getExpenseById(id);

    if (!expense) {
      return errorResponse("Expense not found.", 404);
    }

    return successResponse({ expense }, "Expense retrieved successfully");
  } catch (error) {
    return errorResponse("Failed to retrieve expense.", 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return errorResponse("Invalid expense id.", 400);
  }

  try {
    const body = await request.json();
    const input = expenseSchema.parse(body);
    const expense = await updateExpense(id, input, user);

    return successResponse({ expense }, "Expense updated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid expense payload.", 400, error.flatten());
    }

    if (error instanceof ExpenseServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update expense.", 500);
  }
}
