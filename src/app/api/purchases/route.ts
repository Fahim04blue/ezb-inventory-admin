import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listPurchases, createPurchase, PurchaseServiceError } from "@/features/purchases/services/purchase.service";
import { createPurchaseSchema } from "@/features/purchases/schemas/purchase.schema";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", code: 401, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    const purchases = await listPurchases();

    return NextResponse.json({
      status: "success",
      code: 200,
      message: "Purchases retrieved successfully",
      data: { purchases },
    });
  } catch (error) {
    console.error("Error in GET /api/purchases:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", code: 401, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = createPurchaseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { status: "error", code: 400, message: "Invalid input", data: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const purchase = await createPurchase(result.data, user);

    return NextResponse.json(
      {
        status: "success",
        code: 201,
        message: "Purchase created successfully",
        data: { purchase },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/purchases:", error);

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
