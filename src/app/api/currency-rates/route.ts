import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { createCurrencyRateSchema } from "@/features/currency-rates/schemas/currency-rate-schemas";
import {
  createCurrencyRate,
  CurrencyRateServiceError,
  listCurrencyRates,
} from "@/features/currency-rates/services/currency-rate-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const currencyRates = await listCurrencyRates();
  return successResponse(
    { currencyRates },
    "Currency rates retrieved successfully",
  );
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const body = await request.json();
    const input = createCurrencyRateSchema.parse(body);
    const currencyRate = await createCurrencyRate(input, user);

    return successResponse(
      { currencyRate },
      "Currency rate created successfully",
      201,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid currency rate payload.", 400, error.flatten());
    }

    if (error instanceof CurrencyRateServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to create currency rate.", 500);
  }
}
