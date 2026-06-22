import { type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateExpenseStatusSchema } from "@/features/expenses/schemas/expense-schemas";
import {
  updateExpenseStatus,
  ExpenseServiceError,
} from "@/features/expenses/services/expense-service";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function PATCH(
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
    const input = updateExpenseStatusSchema.parse(body);
    const expense = await updateExpenseStatus(id, input, user);

    return successResponse(
      { expense },
      `Expense ${expense.isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid expense status payload.", 400, error.flatten());
    }

    if (error instanceof ExpenseServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update expense status.", 500);
  }
}
