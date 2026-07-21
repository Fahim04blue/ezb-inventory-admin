import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { updateSheinBatchItemQuoteSchema } from "@/features/shein/schemas/shein.schema";
import { SheinServiceError, updateSheinBatchItemQuote } from "@/features/shein/services/shein.service";
import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";

type Params = { params: Promise<{ itemId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = updateSheinBatchItemQuoteSchema.parse(await request.json());
    const item = await updateSheinBatchItemQuote((await params).itemId, input);
    return successResponse({ item }, "SHEIN item quote updated successfully.");
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid quote payload.", 400, error.flatten());
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    console.error("Failed to update SHEIN item quote", error);
    return errorResponse("Failed to update SHEIN item quote.", 500);
  }
}
