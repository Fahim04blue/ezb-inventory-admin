import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { listBrands } from "@/features/brands/services/brand-service";
import { listCategories } from "@/features/categories/services/category-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const [brands, categories] = await Promise.all([
    listBrands(),
    listCategories(),
  ]);

  return successResponse(
    { brands, categories },
    "Product options retrieved successfully",
  );
}
