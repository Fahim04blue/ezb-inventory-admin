import { NextRequest, NextResponse } from "next/server";

import {
  addProductVariant,
  ProductServiceError,
} from "@/features/products/services/product-service";
import { productVariantSchema } from "@/features/products/schemas/product-schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { status: "error", code: 400, message: "Invalid product ID", data: null },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = productVariantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { status: "error", code: 400, message: "Invalid input", data: result.error },
        { status: 400 },
      );
    }

    const variant = await addProductVariant(id, result.data, { id: 1 }); // Hardcoded user for MVP

    return NextResponse.json({
      status: "success",
      code: 201,
      message: "Variant added successfully",
      data: { variant },
    });
  } catch (error) {
    console.error("Error in POST /api/products/[id]/variants:", error);

    if (error instanceof ProductServiceError) {
      return NextResponse.json(
        { status: "error", code: error.status, message: error.message, data: null },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { status: "error", code: 500, message: "Internal server error", data: null },
      { status: 500 },
    );
  }
}
