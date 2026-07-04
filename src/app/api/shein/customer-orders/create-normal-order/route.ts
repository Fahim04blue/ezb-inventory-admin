import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { createNormalOrderFromSheinSchema } from "@/features/shein/schemas/shein.schema";
import {
  createNormalOrderFromShein,
  SheinServiceError,
} from "@/features/shein/services/shein.service";

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = createNormalOrderFromSheinSchema.parse(await request.json());
    const order = await createNormalOrderFromShein(input, user);
    return successResponse({ order }, "Normal order created from SHEIN items.", 201);
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid SHEIN order payload.", 400, error.flatten());
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to create normal order from SHEIN items.", 500);
  }
}
