import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { sheinBatchItemSchema } from "@/features/shein/schemas/shein.schema";
import {
  createSheinBatchItem,
  SheinServiceError,
} from "@/features/shein/services/shein.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = sheinBatchItemSchema.parse(await request.json());
    const item = await createSheinBatchItem((await params).id, input);
    return successResponse({ item }, "SHEIN item created successfully.", 201);
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid SHEIN item payload.", 400, error.flatten());
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to create SHEIN item.", 500);
  }
}
