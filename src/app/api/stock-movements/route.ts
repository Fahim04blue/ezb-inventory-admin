import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getStockMovementsForVariant } from "@/features/stock/services/stock-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  const variantId = Number(request.nextUrl.searchParams.get("variantId"));

  if (!Number.isInteger(variantId) || variantId <= 0) {
    return errorResponse("Variant ID is required.", 400);
  }

  try {
    const movements = await getStockMovementsForVariant(variantId);
    return successResponse({ movements }, "Stock movements retrieved successfully");
  } catch {
    return errorResponse("Failed to retrieve stock movements.", 500);
  }
}
