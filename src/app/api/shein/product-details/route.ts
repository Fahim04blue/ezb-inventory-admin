import type { NextRequest } from "next/server";
import { z, ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  SheinProductImportError,
  testSheinProductImport,
} from "@/features/shein/services/shein-product-import.service";

export const maxDuration = 130;

const requestSchema = z.object({
  query: z.string().trim().min(1).max(2_000),
});

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = requestSchema.parse(await request.json());
    const product = await testSheinProductImport(input.query);
    return successResponse({ product }, "SHEIN product details retrieved successfully.");
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Enter a valid SHEIN product URL or product ID.", 400, error.flatten());
    }
    if (error instanceof SheinProductImportError) {
      return errorResponse(error.message, error.status);
    }
    if (error instanceof Error && error.name === "TimeoutError") {
      return errorResponse("SHEIN product lookup did not finish within 125 seconds.", 504);
    }
    return errorResponse("Failed to retrieve the SHEIN product details.", 500);
  }
}
