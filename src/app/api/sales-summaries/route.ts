import { type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { salesSummarySchema } from "@/features/sales-summary/schemas/sales-summary-schemas";
import {
  createSalesSummary,
  getSalesSummaries,
  SalesSummaryServiceError,
} from "@/features/sales-summary/services/sales-summary-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const salesSummaries = await getSalesSummaries();
    return successResponse({ salesSummaries }, "Sales summaries retrieved successfully");
  } catch (error) {
    return errorResponse("Failed to retrieve sales summaries.", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const body = await request.json();
    const input = salesSummarySchema.parse(body);
    const salesSummary = await createSalesSummary(input, user);

    return successResponse({ salesSummary }, "Sales summary created successfully", 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid sales summary payload.", 400, error.flatten());
    }

    if (error instanceof SalesSummaryServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to create sales summary.", 500);
  }
}
