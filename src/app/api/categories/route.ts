import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { createCategorySchema } from "@/features/categories/schemas/category-schemas";
import {
  CategoryServiceError,
  createCategory,
  listCategories,
} from "@/features/categories/services/category-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const categories = await listCategories();
  return successResponse({ categories }, "Categories retrieved successfully");
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const body = await request.json();
    const input = createCategorySchema.parse(body);
    const category = await createCategory(input, user);

    return successResponse({ category }, "Category created successfully", 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid category payload.", 400, error.flatten());
    }

    if (error instanceof CategoryServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to create category.", 500);
  }
}
