import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateBrandSchema } from "@/features/brands/schemas/brand-schemas";
import {
  BrandServiceError,
  getBrandById,
  updateBrand,
} from "@/features/brands/services/brand-service";

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
    return errorResponse("Invalid brand id.", 400);
  }

  try {
    const brand = await getBrandById(id);
    return successResponse({ brand }, "Brand retrieved successfully");
  } catch (error) {
    if (error instanceof BrandServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to retrieve brand.", 500);
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
    return errorResponse("Invalid brand id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateBrandSchema.parse(body);
    const brand = await updateBrand(id, input, user);

    return successResponse({ brand }, "Brand updated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid brand update payload.", 400, error.flatten());
    }

    if (error instanceof BrandServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update brand.", 500);
  }
}
