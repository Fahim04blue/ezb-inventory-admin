import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { createOrderSchema } from "@/features/orders/schemas/order.schema";
import {
  createOrder,
  getOrdersPageData,
  OrderServiceError,
} from "@/features/orders/services/order.service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const data = await getOrdersPageData();
    return successResponse(data, "Orders retrieved successfully.");
  } catch {
    return errorResponse("Failed to retrieve orders.", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const body = await request.json();
    const input = createOrderSchema.parse(body);
    const order = await createOrder(input, user);
    return successResponse({ order }, "Order created successfully.", 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid order payload.", 400, error.flatten());
    }

    if (error instanceof OrderServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to create order.", 500);
  }
}
