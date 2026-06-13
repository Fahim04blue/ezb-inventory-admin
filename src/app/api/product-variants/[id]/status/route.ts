import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateProductVariantStatusSchema } from "@/features/products/schemas/product-schemas";
import {
  ProductServiceError,
  updateProductVariantStatus,
} from "@/features/products/services/product-service";

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
    return errorResponse("Invalid product variant id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateProductVariantStatusSchema.parse(body);
    const variant = await updateProductVariantStatus(id, input, user);

    return successResponse(
      { variant },
      "Product variant status updated successfully",
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        "Invalid product variant status payload.",
        400,
        error.flatten(),
      );
    }

    if (error instanceof ProductServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update product variant status.", 500);
  }
}
