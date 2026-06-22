import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getStockOverview } from "@/features/stock/services/stock-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const stock = await getStockOverview();
    return successResponse(stock, "Stock overview retrieved successfully");
  } catch {
    return errorResponse("Failed to retrieve stock overview.", 500);
  }
}
