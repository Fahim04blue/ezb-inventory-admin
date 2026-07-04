import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { sheinBatchSchema } from "@/features/shein/schemas/shein.schema";
import {
  createSheinBatch,
  listSheinBatches,
  SheinServiceError,
} from "@/features/shein/services/shein.service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  const batches = await listSheinBatches();
  return successResponse({ batches }, "SHEIN batches retrieved successfully.");
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = sheinBatchSchema.parse(await request.json());
    const batch = await createSheinBatch(input);
    return successResponse({ batch }, "SHEIN batch created successfully.", 201);
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid SHEIN batch payload.", 400, error.flatten());
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to create SHEIN batch.", 500);
  }
}
