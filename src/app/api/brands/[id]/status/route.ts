import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateBrandStatusSchema } from "@/features/brands/schemas/brand-schemas";
import {
  BrandServiceError,
  updateBrandStatus,
} from "@/features/brands/services/brand-service";

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
    return errorResponse("Invalid brand id.", 400);
  }

  try {
    const body = await request.json();
    const input = updateBrandStatusSchema.parse(body);
    const brand = await updateBrandStatus(id, input, user);

    return successResponse({ brand }, "Brand status updated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid brand status payload.", 400, error.flatten());
    }

    if (error instanceof BrandServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to update brand status.", 500);
  }
}
