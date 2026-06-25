import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateRateTypeSchema } from "@/features/rate-types/schemas/rate-type-schemas";
import {
  RateTypeServiceError,
  getRateTypeById,
  updateRateType,
} from "@/features/rate-types/services/rate-type-service";

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
    return errorResponse("Session expired. Please login again.", 401);
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return errorResponse("Invalid rate type id.", 400);
  }

  try {
    const rateType = await getRateTypeById(id);
    return successResponse({ rateType }, "Rate type retrieved successfully");
  } catch (error) {
    if (error instanceof RateTypeServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to retrieve rate type.", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return errorResponse("Invalid rate type id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateRateTypeSchema.parse(body);
    const rateType = await updateRateType(id, input, user);

    return successResponse({ rateType }, "Rate type updated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid rate type update payload.", 400, error.flatten());
    }

    if (error instanceof RateTypeServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update rate type.", 500);
  }
}
