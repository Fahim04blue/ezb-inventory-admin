import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { sheinBatchSchema } from "@/features/shein/schemas/shein.schema";
import {
  deleteSheinBatch,
  getSheinBatch,
  SheinServiceError,
  updateSheinBatch,
} from "@/features/shein/services/shein.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const batch = await getSheinBatch((await params).id);
    return successResponse({ batch }, "SHEIN batch retrieved successfully.");
  } catch (error) {
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to retrieve SHEIN batch.", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = sheinBatchSchema.parse(await request.json());
    const batch = await updateSheinBatch((await params).id, input);
    return successResponse({ batch }, "SHEIN batch updated successfully.");
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid SHEIN batch payload.", 400, error.flatten());
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to update SHEIN batch.", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    await deleteSheinBatch((await params).id);
    return successResponse({ id: (await params).id }, "SHEIN batch deleted successfully.");
  } catch (error) {
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to delete SHEIN batch.", 500);
  }
}
