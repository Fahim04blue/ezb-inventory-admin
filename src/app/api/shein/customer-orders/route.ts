import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { listSheinCustomerOrders } from "@/features/shein/services/shein.service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  const customerOrders = await listSheinCustomerOrders();
  return successResponse({ customerOrders }, "SHEIN customer orders retrieved successfully.");
}
