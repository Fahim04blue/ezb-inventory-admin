import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  PurchaseServiceError,
  updatePurchasePayment,
} from "@/features/purchases/services/purchase.service";
import { updatePurchasePaymentSchema } from "@/features/purchases/schemas/purchase.schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", code: 401, message: "Unauthorized", data: null },
        { status: 401 },
      );
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { status: "error", code: 400, message: "Invalid purchase ID", data: null },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = updatePurchasePaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { status: "error", code: 400, message: "Invalid input", data: result.error },
        { status: 400 },
      );
    }

    const purchase = await updatePurchasePayment(id, result.data, user);

    return NextResponse.json({
      status: "success",
      code: 200,
      message: "Purchase payment updated successfully.",
      data: { purchase },
    });
  } catch (error) {
    console.error("Error in PATCH /api/purchases/[id]/payment:", error);

    if (error instanceof PurchaseServiceError) {
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
