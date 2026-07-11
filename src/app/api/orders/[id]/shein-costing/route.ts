import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateSheinOrderCostingSchema } from "@/features/orders/schemas/order.schema";
import {
  OrderServiceError,
  updateSheinOrderCosting,
} from "@/features/orders/services/order.service";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return errorResponse("Invalid order id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateSheinOrderCostingSchema.parse(body);
    const order = await updateSheinOrderCosting(id, input, user);
    return successResponse({ order }, "SHEIN costing updated successfully.");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid SHEIN costing payload.", 400, error.flatten());
    }

    if (error instanceof OrderServiceError) {
      return errorResponse(error.message, error.status);
    }

    console.error("Failed to update SHEIN order costing", { orderId: id, error });
    return errorResponse("Failed to update SHEIN order costing.", 500);
  }
}
