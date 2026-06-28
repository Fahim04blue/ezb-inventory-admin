import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { createPreOrderDeliverySchema } from "@/features/orders/schemas/order.schema";
import {
  deliverPreOrderItems,
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
    const input = createPreOrderDeliverySchema.parse(body);
    const delivery = await deliverPreOrderItems(id, input, user);
    return successResponse(
      { delivery },
      "Delivery batch created successfully.",
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid pre-order delivery payload.", 400, error.flatten());
    }

    if (error instanceof OrderServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to create delivery batch.", 500);
  }
}
