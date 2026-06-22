import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateProductSchema } from "@/features/products/schemas/product-schemas";
import {
  getProductById,
  ProductServiceError,
  updateProduct,
} from "@/features/products/services/product-service";

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
    return errorResponse("Invalid product id.", 400);
  }

  try {
    const product = await getProductById(id);
    return successResponse({ product }, "Product retrieved successfully");
  } catch (error) {
    if (error instanceof ProductServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to retrieve product.", 500);
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
    return errorResponse("Invalid product id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateProductSchema.parse(body);
    const product = await updateProduct(id, input, user);

    return successResponse({ product }, "Product updated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid product update payload.", 400, error.flatten());
    }

    if (error instanceof ProductServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update product.", 500);
  }
}
