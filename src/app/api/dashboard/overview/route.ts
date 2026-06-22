import type { NextRequest } from "next/server";

import { getDashboardOverview } from "@/features/dashboard/services/dashboard.service";
import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const data = await getDashboardOverview();
    return successResponse(data, "Dashboard loaded successfully.");
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    return errorResponse("Failed to load dashboard.", 500);
  }
}
