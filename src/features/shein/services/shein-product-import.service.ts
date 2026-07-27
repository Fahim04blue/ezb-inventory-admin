import "server-only";

const DEFAULT_ACTOR_ID = "native_emblem~shein-product-scraper";

export class SheinProductImportError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "SheinProductImportError";
  }
}

export type SheinProductImportResult = {
  id: string | null;
  sku: string | null;
  title: string;
  url: string;
  category: string | null;
  price: number | null;
  priceFormatted: string | null;
  currency: string | null;
  inStock: boolean | null;
  color: string | null;
  images: string[];
  colorVariants: unknown[];
  raw: Record<string, unknown>;
};

function parseSheinProductInput(rawInput: string) {
  const normalizedInput = rawInput.trim();

  if (/^\d+$/.test(normalizedInput)) {
    return {
      actorInput: {
        goodsIds: [normalizedInput],
        country: process.env.APIFY_SHEIN_COUNTRY?.trim() || "MY",
      },
      fallbackUrl: `https://my.shein.com/product-p-${normalizedInput}.html`,
    };
  }

  let url: URL;

  try {
    url = new URL(normalizedInput);
  } catch {
    throw new SheinProductImportError("Enter a valid SHEIN product URL or numeric product ID.");
  }

  const hostname = url.hostname.toLowerCase();
  const isSheinHost =
    hostname === "shein.com" ||
    hostname.endsWith(".shein.com") ||
    hostname === "shein.co.uk" ||
    hostname.endsWith(".shein.co.uk") ||
    /^([a-z0-9-]+\.)*shein\.(com\.[a-z]{2}|co\.[a-z]{2}|[a-z]{2,3})$/i.test(hostname);

  if (url.protocol !== "https:" || !isSheinHost) {
    throw new SheinProductImportError("Only HTTPS URLs from a SHEIN domain are allowed.");
  }

  if (!/-p-\d+(?:\.html)?/i.test(url.pathname)) {
    throw new SheinProductImportError(
      "This does not look like a SHEIN product URL. The URL should contain -p-{product_id}.html.",
    );
  }

  return {
    actorInput: { productUrls: [url.toString()] },
    fallbackUrl: url.toString(),
  };
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function testSheinProductImport(rawInput: string): Promise<SheinProductImportResult> {
  const token = process.env.APIFY_API_TOKEN?.trim();
  const actorId = process.env.APIFY_SHEIN_ACTOR?.trim() || DEFAULT_ACTOR_ID;

  if (!token) {
    throw new SheinProductImportError(
      "APIFY_API_TOKEN is not configured on the server.",
      503,
    );
  }

  const { actorInput, fallbackUrl } = parseSheinProductInput(rawInput);
  const response = await fetch(
    `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?timeout=120`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...actorInput,
        maxItems: 1,
        proxyConfiguration: { useApifyProxy: true },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(125_000),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new SheinProductImportError(
      `Apify request failed (${response.status})${details ? `: ${details.slice(0, 300)}` : "."}`,
      response.status === 401 || response.status === 403 ? 502 : 503,
    );
  }

  const payload: unknown = await response.json();
  const records = Array.isArray(payload) ? payload : [];
  const record = records[0];

  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new SheinProductImportError(
      "Apify completed the run but returned no product. Check the URL and Actor run log.",
      502,
    );
  }

  const raw = record as Record<string, unknown>;
  const title = nullableString(raw.title) ?? nullableString(raw.name);

  if (!title) {
    throw new SheinProductImportError(
      "Apify returned a record without a product title. Review the raw Actor output.",
      502,
    );
  }

  return {
    id: nullableString(raw.id) ?? nullableString(raw.productId) ?? nullableString(raw.goodsId),
    sku: nullableString(raw.sku),
    title,
    url: nullableString(raw.url) ?? nullableString(raw.productUrl) ?? fallbackUrl,
    category: nullableString(raw.category),
    price: nullableNumber(raw.price),
    priceFormatted: nullableString(raw.priceFormatted),
    currency: nullableString(raw.currency),
    inStock: typeof raw.inStock === "boolean" ? raw.inStock : null,
    color: nullableString(raw.color),
    images: Array.isArray(raw.images)
      ? raw.images.filter((image): image is string => typeof image === "string")
      : [],
    colorVariants: Array.isArray(raw.colorVariants) ? raw.colorVariants : [],
    raw,
  };
}
