import type { NextRequest } from "next/server";
import { z, ZodError } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  importSheinItemImage,
  SheinItemImageImportError,
} from "@/lib/supabase/shein-item-images";
import { SupabaseStorageConfigError } from "@/lib/supabase/server";

const schema = z.object({ imageUrl: z.string().trim().url().max(2_000) });

export async function POST(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return errorResponse("Session expired. Please login again.", 401);

  try {
    const input = schema.parse(await request.json());
    const image = await importSheinItemImage(input.imageUrl);
    return successResponse(image, "Selected image stored in Supabase.");
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Invalid image URL.", 400, error.flatten());
    if (error instanceof SheinItemImageImportError) return errorResponse(error.message, 400);
    if (error instanceof SupabaseStorageConfigError) return errorResponse(error.message, 500);
    return errorResponse("Failed to store the selected SHEIN image.", 500);
  }
}
