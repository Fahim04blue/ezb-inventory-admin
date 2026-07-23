import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { reverseSheinCustomerOrderSchema } from "@/features/shein/schemas/shein.schema";
import { reverseSheinCustomerOrder, SheinServiceError } from "@/features/shein/services/shein.service";
import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function PATCH(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = reverseSheinCustomerOrderSchema.parse(await request.json());
    const result = await reverseSheinCustomerOrder(input, user);
    return successResponse({ result }, "SHEIN order reversed to Ready for Delivery.");
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid reversal payload.", 400, error.flatten());
    if (error instanceof SheinServiceError) return errorResponse(error.message, error.status);
    console.error("Failed to reverse SHEIN customer order", error);
    return errorResponse("Failed to reverse SHEIN customer order.", 500);
  }
}
