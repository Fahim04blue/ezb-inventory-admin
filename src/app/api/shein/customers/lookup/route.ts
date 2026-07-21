import type { NextRequest } from "next/server";

import { findSheinCustomerByPhone } from "@/features/shein/services/shein.service";
import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  const phone = request.nextUrl.searchParams.get("phone")?.trim() ?? "";
  if (!phone) return errorResponse("Phone number is required.", 400);

  try {
    const customer = await findSheinCustomerByPhone(phone);
    return successResponse({ customer }, "Customer lookup completed.");
  } catch (error) {
    console.error("Failed to look up SHEIN customer", error);
    return errorResponse("Failed to look up customer.", 500);
  }
}
