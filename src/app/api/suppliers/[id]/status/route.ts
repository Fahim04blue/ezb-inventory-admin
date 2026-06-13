import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateSupplierStatusSchema } from "@/features/suppliers/schemas/supplier-schemas";
import {
  SupplierServiceError,
  updateSupplierStatus,
} from "@/features/suppliers/services/supplier-service";

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
    return errorResponse("Unauthorized.", 401);
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return errorResponse("Invalid supplier id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateSupplierStatusSchema.parse(body);
    const supplier = await updateSupplierStatus(id, input, user);

    return successResponse({ supplier }, "Supplier status updated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid supplier status payload.", 400, error.flatten());
    }

    if (error instanceof SupplierServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update supplier status.", 500);
  }
}
