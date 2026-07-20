import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { assignSheinItemsCustomerSchema } from "@/features/shein/schemas/shein.schema";
import {
  assignSheinItemsCustomer,
  SheinServiceError,
} from "@/features/shein/services/shein.service";
import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function PATCH(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = assignSheinItemsCustomerSchema.parse(await request.json());
    const items = await assignSheinItemsCustomer(input);
    return successResponse({ items }, "Customer assigned successfully.");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid customer assignment payload.", 400, error.flatten());
    }
    if (error instanceof SheinServiceError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Failed to assign SHEIN items to customer", error);
    return errorResponse("Failed to assign customer.", 500);
  }
}
