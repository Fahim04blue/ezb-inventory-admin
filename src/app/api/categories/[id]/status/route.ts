import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateCategoryStatusSchema } from "@/features/categories/schemas/category-schemas";
import {
  CategoryServiceError,
  updateCategoryStatus,
} from "@/features/categories/services/category-service";

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
    return errorResponse("Session expired. Please login again.", 401);
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return errorResponse("Invalid category id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateCategoryStatusSchema.parse(body);
    const category = await updateCategoryStatus(id, input, user);

    return successResponse({ category }, `Category ${category.isActive ? "activated" : "deactivated"} successfully`);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid category status payload.", 400, error.flatten());
    }

    if (error instanceof CategoryServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update category status.", 500);
  }
}
