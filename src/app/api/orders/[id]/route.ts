import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateOrderSchema } from "@/features/orders/schemas/order.schema";
import {
  getOrderById,
  OrderServiceError,
  updateOrder,
} from "@/features/orders/services/order.service";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
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
    const order = await getOrderById(id);
    return successResponse({ order }, "Order retrieved successfully.");
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to retrieve order.", 500);
  }
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
    const input = updateOrderSchema.parse(body);
    const order = await updateOrder(id, input, user);
    return successResponse({ order }, "Order updated successfully.");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid order payload.", 400, error.flatten());
    }

    if (error instanceof OrderServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update order.", 500);
  }
}
