import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { sheinBatchItemsBulkSchema } from "@/features/shein/schemas/shein.schema";
import {
  createSheinBatchItems,
  SheinServiceError,
} from "@/features/shein/services/shein.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = sheinBatchItemsBulkSchema.parse(await request.json());
    const items = await createSheinBatchItems((await params).id, input);
    return successResponse({ items }, "SHEIN items saved successfully.", 201);
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid SHEIN items payload.", 400, error.flatten());
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to save SHEIN items.", 500);
  }
}
