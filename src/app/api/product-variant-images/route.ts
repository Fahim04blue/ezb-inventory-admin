import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  ProductImageUploadError,
  uploadProductVariantImage,
  validateProductVariantImage,
} from "@/lib/supabase/product-images";
import { SupabaseStorageConfigError } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!user) {
    return errorResponse("Session expired. Please login again.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return errorResponse("Image file is required.", 400);
    }

    validateProductVariantImage(file);
    const image = await uploadProductVariantImage(file);

    return successResponse(image, "Image uploaded successfully.");
  } catch (error) {
    if (error instanceof ProductImageUploadError) {
      return errorResponse(error.message, 400);
    }

    if (error instanceof SupabaseStorageConfigError) {
      return errorResponse(
        "Supabase Storage is not configured on the server. Check the Supabase environment variables and restart the dev server.",
        500,
      );
    }

    console.error("Product variant image upload failed:", error);
    return errorResponse("Failed to upload image.", 500);
  }
}
