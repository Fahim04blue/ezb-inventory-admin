import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPurchaseById, PurchaseServiceError } from "@/features/purchases/services/purchase.service";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", code: 401, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { status: "error", code: 400, message: "Invalid purchase ID", data: null },
        { status: 400 }
      );
    }

    const purchase = await getPurchaseById(id);

    return NextResponse.json({
      status: "success",
      code: 200,
      message: "Purchase retrieved successfully",
      data: { purchase },
    });
  } catch (error) {
    console.error("Error in GET /api/purchases/[id]:", error);

    if (error instanceof PurchaseServiceError) {
      return NextResponse.json(
        { status: "error", code: error.status, message: error.message, data: null },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { status: "error", code: 500, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", code: 401, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { status: "error", code: 400, message: "Invalid purchase ID", data: null },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { updatePurchaseSchema } = await import("@/features/purchases/schemas/purchase.schema");
    const { updatePurchase } = await import("@/features/purchases/services/purchase.service");

    const validatedData = updatePurchaseSchema.parse(body);
    const purchase = await updatePurchase(id, validatedData, { id: user.id });

    return NextResponse.json({
      status: "success",
      code: 200,
      message: "Purchase updated successfully",
      data: { purchase },
    });
  } catch (error) {
    console.error("Error in PUT /api/purchases/[id]:", error);

    if (error instanceof PurchaseServiceError) {
      return NextResponse.json(
        { status: "error", code: error.status, message: error.message, data: null },
        { status: error.status }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { status: "error", code: 400, message: "Validation error", data: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { status: "error", code: 500, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}
