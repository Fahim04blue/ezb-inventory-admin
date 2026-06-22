import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { fulfillPreOrderSchema } from "@/features/orders/schemas/order.schema";
import {
  fulfillPreOrder,
  OrderServiceError,
} from "@/features/orders/services/order.service";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function POST(
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
    const input = fulfillPreOrderSchema.parse(body);
    const order = await fulfillPreOrder(id, input, user);
    return successResponse({ order }, "Pre-order fulfilled successfully.");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid pre-order fulfillment payload.", 400, error.flatten());
    }

    if (error instanceof OrderServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to fulfill pre-order.", 500);
  }
}
