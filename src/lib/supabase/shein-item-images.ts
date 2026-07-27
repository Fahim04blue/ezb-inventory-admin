import "server-only";

import { randomUUID } from "crypto";

import { getSupabaseAdmin } from "./server";

const BUCKET = "product-images";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export class SheinItemImageImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheinItemImageImportError";
  }
}

function validateSourceUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SheinItemImageImportError("The selected image URL is invalid.");
  }

  const hostname = url.hostname.toLowerCase();
  const isAllowedHost =
    hostname === "ltwebstatic.com" ||
    hostname.endsWith(".ltwebstatic.com") ||
    hostname === "shein.com" ||
    hostname.endsWith(".shein.com");

  if (url.protocol !== "https:" || !isAllowedHost) {
    throw new SheinItemImageImportError("Only HTTPS images hosted by SHEIN are allowed.");
  }

  return url;
}

export async function importSheinItemImage(rawUrl: string) {
  const sourceUrl = validateSourceUrl(rawUrl);
  const response = await fetch(sourceUrl, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; EssentialsByZatab/1.0)" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new SheinItemImageImportError(`SHEIN image download failed (${response.status}).`);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0].toLowerCase() ?? "";
  const extension = ALLOWED_TYPES.get(contentType);
  if (!extension) {
    throw new SheinItemImageImportError("The selected image is not JPG, PNG, or WEBP.");
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_SIZE) {
    throw new SheinItemImageImportError("The selected image is larger than 5 MB.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_SIZE) {
    throw new SheinItemImageImportError("The selected image is larger than 5 MB.");
  }

  const imagePath = `shein-items/${randomUUID()}.${extension}`;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).upload(imagePath, buffer, {
    contentType,
    upsert: false,
  });

  if (error) throw new SheinItemImageImportError(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(imagePath);
  return { imagePath, imageUrl: data.publicUrl };
}
