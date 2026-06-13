import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { createSupplierSchema } from "@/features/suppliers/schemas/supplier-schemas";
import {
  createSupplier,
  listSuppliers,
  SupplierServiceError,
} from "@/features/suppliers/services/supplier-service";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Unauthorized.", 401);
  }

  const suppliers = await listSuppliers();
  return successResponse({ suppliers }, "Suppliers retrieved successfully");
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Unauthorized.", 401);
  }

  try {
    const body = await request.json();
    const input = createSupplierSchema.parse(body);
    const supplier = await createSupplier(input, user);

    return successResponse({ supplier }, "Supplier created successfully", 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Invalid supplier payload.", 400, error.flatten());
    }

    if (error instanceof SupplierServiceError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("Failed to create supplier.", 500);
  }
}
