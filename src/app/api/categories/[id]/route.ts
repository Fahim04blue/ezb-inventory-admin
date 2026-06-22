import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateCategorySchema } from "@/features/categories/schemas/category-schemas";
import {
  CategoryServiceError,
  getCategoryById,
  updateCategory,
} from "@/features/categories/services/category-service";

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
    return errorResponse("Invalid category id.", 400);
  }

  try {
    const category = await getCategoryById(id);
    return successResponse({ category }, "Category retrieved successfully");
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to retrieve category.", 500);
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
    return errorResponse("Invalid category id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateCategorySchema.parse(body);
    const category = await updateCategory(id, input, user);

    return successResponse({ category }, "Category updated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid category update payload.", 400, error.flatten());
    }

    if (error instanceof CategoryServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update category.", 500);
  }
}
