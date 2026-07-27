/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import type { SheinProductImportResult } from "../services/shein-product-import.service";

export function SheinProductImportTest() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<SheinProductImportResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setProduct(null);

    try {
      const result = await apiClient<{ product: SheinProductImportResult }>(
        "/api/shein/product-import-test",
        {
          method: "POST",
          body: JSON.stringify({ url }),
          showSuccessToast: true,
        },
      );
      setProduct(result.product);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-lg">Test a product URL</CardTitle>
          <p className="text-sm text-muted-foreground">
            This only fetches and displays data. It does not save anything.
          </p>
        </CardHeader>
        <CardContent className="p-5">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="shein-product-url">SHEIN product URL</Label>
              <Input
                id="shein-product-url"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://...shein.com/...-p-12345678.html"
                required
                type="url"
                value={url}
              />
            </div>
            <Button className="gap-2 bg-emerald-700 hover:bg-emerald-800" disabled={isLoading} type="submit">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isLoading ? "Waiting for Apify…" : "Fetch with Apify"}
            </Button>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">The first Actor run can take a minute or two.</p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {product ? (
        <Card className="rounded-2xl">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row">
              {product.images[0] ? (
                <img
                  alt={product.title}
                  className="h-40 w-40 rounded-xl border object-cover"
                  src={product.images[0]}
                />
              ) : null}
              <div className="min-w-0 space-y-2">
                <h2 className="text-xl font-semibold text-slate-950">{product.title}</h2>
                <p className="text-sm text-muted-foreground">Product ID: {product.id ?? "Not returned"}</p>
                <p className="text-sm text-muted-foreground">SKU: {product.sku ?? "Not returned"}</p>
                <p className="text-sm text-muted-foreground">Category: {product.category ?? "Not returned"}</p>
                <p className="text-sm font-medium">
                  {product.priceFormatted ?? [product.price, product.currency].filter(Boolean).join(" ") ?? "Price not returned"}
                </p>
                <a className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700" href={product.url} rel="noreferrer" target="_blank">
                  Open SHEIN product <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {product.images.length ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Images ({product.images.length})</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <img alt={`${product.title} ${index + 1}`} className="h-24 w-24 shrink-0 rounded-lg border object-cover" key={`${image}-${index}`} src={image} />
                  ))}
                </div>
              </div>
            ) : null}

            <details className="rounded-xl border bg-slate-950 text-slate-100">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Raw Apify response</summary>
              <pre className="max-h-[480px] overflow-auto border-t border-slate-800 p-4 text-xs">{JSON.stringify(product.raw, null, 2)}</pre>
            </details>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
