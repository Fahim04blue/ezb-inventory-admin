import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { createBrandSchema } from "@/features/brands/schemas/brand-schemas";
import {
  BrandServiceError,
  createBrand,
  listBrands,
} from "@/features/brands/services/brand-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const brands = await listBrands();
  return successResponse({ brands }, "Brands retrieved successfully");
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const body = await request.json();
    const input = createBrandSchema.parse(body);
    const brand = await createBrand(input, user);

    return successResponse({ brand }, "Brand created successfully", 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid brand payload.", 400, error.flatten());
    }

    if (error instanceof BrandServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to create brand.", 500);
  }
}
