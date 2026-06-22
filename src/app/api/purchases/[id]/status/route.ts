import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updatePurchaseStatus, PurchaseServiceError } from "@/features/purchases/services/purchase.service";
import { updatePurchaseStatusSchema } from "@/features/purchases/schemas/purchase.schema";

export async function PATCH(
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
    const result = updatePurchaseStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { status: "error", code: 400, message: "Invalid input", data: result.error },
        { status: 400 }
      );
    }

    const purchase = await updatePurchaseStatus(id, result.data, user);

    return NextResponse.json({
      status: "success",
      code: 200,
      message: "Purchase status updated successfully",
      data: { purchase },
    });
  } catch (error) {
    console.error("Error in PATCH /api/purchases/[id]/status:", error);

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
