import "server-only";

import { randomUUID } from "crypto";

import { getSupabaseAdmin } from "./server";

const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export class ProductImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductImageUploadError";
  }
}

export function validateProductVariantImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new ProductImageUploadError("Only JPG, PNG, and WEBP images are allowed.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new ProductImageUploadError("Image must be 3MB or smaller.");
  }
}

export async function uploadProductVariantImage(file: File) {
  validateProductVariantImage(file);

  const extension = ALLOWED_IMAGE_TYPES.get(file.type);
  const imagePath = `product-variants/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(imagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new ProductImageUploadError(error.message);
  }

  const { data } = supabaseAdmin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(imagePath);

  return {
    imagePath,
    imageUrl: data.publicUrl,
  };
}
