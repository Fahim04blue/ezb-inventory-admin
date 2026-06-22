import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  getReportsOverview,
  ReportServiceError,
} from "@/features/reports/services/report.service";
import type { ReportDateRange } from "@/features/reports/types/report.types";

const DATE_RANGES = new Set<ReportDateRange>([
  "all",
  "today",
  "this_month",
  "last_month",
  "last_30_days",
  "custom",
]);

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const value = request.nextUrl.searchParams.get("dateRange") ?? "all";
    if (!DATE_RANGES.has(value as ReportDateRange)) {
      return errorResponse("Invalid date range.", 400);
    }

    const data = await getReportsOverview({
      dateRange: value as ReportDateRange,
      from: request.nextUrl.searchParams.get("from") ?? undefined,
      to: request.nextUrl.searchParams.get("to") ?? undefined,
    });
    return successResponse(data, "Reports loaded successfully.");
  } catch (error) {
    if (error instanceof ReportServiceError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Failed to load reports:", error);
    return errorResponse("Failed to load reports.", 500);
  }
}
