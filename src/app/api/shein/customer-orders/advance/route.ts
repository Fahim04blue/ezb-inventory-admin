import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { updateSheinCustomerAdvanceSchema } from "@/features/shein/schemas/shein.schema";
import {
  SheinServiceError,
  updateSheinCustomerAdvance,
} from "@/features/shein/services/shein.service";
import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function PATCH(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = updateSheinCustomerAdvanceSchema.parse(await request.json());
    const customerOrders = await updateSheinCustomerAdvance(input);
    return successResponse({ customerOrders }, "SHEIN customer advance updated successfully.");
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid SHEIN customer advance payload.", 400, error.flatten());
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to update SHEIN customer advance.", 500);
  }
}
