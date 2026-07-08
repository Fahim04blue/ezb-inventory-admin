import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateSheinCustomerOrderCostingSchema } from "@/features/shein/schemas/shein.schema";
import {
  SheinServiceError,
  updateSheinCustomerOrderCosting,
} from "@/features/shein/services/shein.service";

export async function PATCH(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = updateSheinCustomerOrderCostingSchema.parse(await request.json());
    const customerOrders = await updateSheinCustomerOrderCosting(input);
    return successResponse({ customerOrders }, "SHEIN costing updated successfully.");
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid SHEIN costing payload.", 400, error.flatten());
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    return errorResponse("Failed to update SHEIN costing.", 500);
  }
}
