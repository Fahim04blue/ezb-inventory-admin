import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateCurrencyRateSchema } from "@/features/currency-rates/schemas/currency-rate-schemas";
import {
  CurrencyRateServiceError,
  getCurrencyRateById,
  updateCurrencyRate,
} from "@/features/currency-rates/services/currency-rate-service";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
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
    const currencyRate = await getCurrencyRateById(id);
    return successResponse(
      { currencyRate },
      "Currency rate retrieved successfully",
    );
  } catch (error) {
    if (error instanceof CurrencyRateServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to retrieve currency rate.", 500);
  }
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
    const input = updateCurrencyRateSchema.parse(body);
    const currencyRate = await updateCurrencyRate(id, input, user);

    return successResponse(
      { currencyRate },
      "Currency rate updated successfully",
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        "Invalid currency rate update payload.",
        400,
        error.flatten(),
      );
    }

    if (error instanceof CurrencyRateServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update currency rate.", 500);
  }
}
