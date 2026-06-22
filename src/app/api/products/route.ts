import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  createProductSchema,
} from "@/features/products/schemas/product-schemas";
import {
  createProduct,
  listProducts,
  ProductServiceError,
} from "@/features/products/services/product-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const products = await listProducts();
  return successResponse({ products }, "Products retrieved successfully");
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const body = await request.json();
    const input = createProductSchema.parse(body);
    const product = await createProduct(input, user);

    return successResponse({ product }, "Product created successfully", 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid product payload.", 400, error.flatten());
    }

    if (error instanceof ProductServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to create product.", 500);
  }
}
