import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { sheinBatchItemSchema } from "@/features/shein/schemas/shein.schema";
import {
  deleteSheinBatchItem,
  SheinServiceError,
  updateSheinBatchItem,
} from "@/features/shein/services/shein.service";

type Params = { params: Promise<{ itemId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = sheinBatchItemSchema.parse(await request.json());
    const item = await updateSheinBatchItem((await params).itemId, input);
    return successResponse({ item }, "SHEIN item updated successfully.");
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid SHEIN item payload.", 400, error.flatten());
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to update SHEIN item.", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    await deleteSheinBatchItem((await params).itemId);
    return successResponse({ id: (await params).itemId }, "SHEIN item deleted successfully.");
  } catch (error) {
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to delete SHEIN item.", 500);
  }
}
