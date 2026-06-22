import { type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateSalesSummaryStatusSchema } from "@/features/sales-summary/schemas/sales-summary-schemas";
import {
  updateSalesSummaryStatus,
  SalesSummaryServiceError,
} from "@/features/sales-summary/services/sales-summary-service";

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
    return errorResponse("Invalid sales summary id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateSalesSummaryStatusSchema.parse(body);
    const salesSummary = await updateSalesSummaryStatus(id, input, user);

    return successResponse(
      { salesSummary },
      `Sales summary ${salesSummary.isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid sales summary status payload.", 400, error.flatten());
    }

    if (error instanceof SalesSummaryServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update sales summary status.", 500);
  }
}
