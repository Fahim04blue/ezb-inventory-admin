import type { NextRequest } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/services/auth-service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  return successResponse({ user }, "Authenticated user retrieved successfully");
}
