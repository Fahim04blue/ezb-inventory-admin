import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateCurrencyRateStatusSchema } from "@/features/currency-rates/schemas/currency-rate-schemas";
import {
  CurrencyRateServiceError,
  updateCurrencyRateStatus,
} from "@/features/currency-rates/services/currency-rate-service";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Unauthorized.", 401);
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return errorResponse("Invalid currency rate id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateCurrencyRateStatusSchema.parse(body);
    const currencyRate = await updateCurrencyRateStatus(id, input, user);

    return successResponse(
      { currencyRate },
      "Currency rate status updated successfully",
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        "Invalid currency rate status payload.",
        400,
        error.flatten(),
      );
    }

    if (error instanceof CurrencyRateServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update currency rate status.", 500);
  }
}
