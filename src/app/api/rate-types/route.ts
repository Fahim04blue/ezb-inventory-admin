import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { createRateTypeSchema } from "@/features/rate-types/schemas/rate-type-schemas";
import {
  RateTypeServiceError,
  createRateType,
  listRateTypes,
} from "@/features/rate-types/services/rate-type-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const rateTypes = await listRateTypes();
  return successResponse({ rateTypes }, "Rate types retrieved successfully");
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const body = await request.json();
    const input = createRateTypeSchema.parse(body);
    const rateType = await createRateType(input, user);

    return successResponse({ rateType }, "Rate type created successfully", 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid rate type payload.", 400, error.flatten());
    }

    if (error instanceof RateTypeServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to create rate type.", 500);
  }
}
