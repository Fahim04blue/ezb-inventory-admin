import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateSupplierSchema } from "@/features/suppliers/schemas/supplier-schemas";
import {
  getSupplierById,
  SupplierServiceError,
  updateSupplier,
} from "@/features/suppliers/services/supplier-service";

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
    return errorResponse("Unauthorized.", 401);
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return errorResponse("Invalid supplier id.", 400);
  }

  try {
    const supplier = await getSupplierById(id);
    return successResponse({ supplier }, "Supplier retrieved successfully");
  } catch (error) {
    if (error instanceof SupplierServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to retrieve supplier.", 500);
  }
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
    const input = updateSupplierSchema.parse(body);
    const supplier = await updateSupplier(id, input, user);

    return successResponse({ supplier }, "Supplier updated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid supplier update payload.", 400, error.flatten());
    }

    if (error instanceof SupplierServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update supplier.", 500);
  }
}
