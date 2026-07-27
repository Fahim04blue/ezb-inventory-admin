/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useState } from "react";
import { Check, Download, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { SheinProductImportResult } from "../services/shein-product-import.service";

export type FetchedSheinItemDetails = {
  sku: string;
  sheinLink: string;
  imageUrl: string;
  size: string;
  color: string;
  actualSheinPriceRm: string;
};

export function SheinItemDetailsFetchDialog({
  open,
  onOpenChange,
  onApply,
  applyLabel = "Use these details",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (details: FetchedSheinItemDetails) => void | Promise<void>;
  applyLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<SheinProductImportResult | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [buyingRm, setBuyingRm] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  async function fetchProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsFetching(true);
    setProduct(null);
    setSelectedImage("");
    try {
      const result = await apiClient<{ product: SheinProductImportResult }>(
        "/api/shein/product-import-test",
        { method: "POST", body: JSON.stringify({ query }) },
      );
      setProduct(result.product);
      setSelectedImage(result.product.images[0] ?? "");
      setColor(result.product.color ?? "");
      setBuyingRm(result.product.currency === "MYR" && result.product.price != null ? String(result.product.price) : "");
    } finally {
      setIsFetching(false);
    }
  }

  async function applyDetails() {
    if (!product || !selectedImage) return;
    setIsApplying(true);
    try {
      const storedImage = await apiClient<{ imagePath: string; imageUrl: string }>(
        "/api/shein/item-images/import",
        {
          method: "POST",
          body: JSON.stringify({ imageUrl: selectedImage }),
          showSuccessToast: true,
        },
      );
      await onApply({
        sku: product.sku ?? "",
        sheinLink: product.url,
        imageUrl: storedImage.imageUrl,
        size: size.trim(),
        color: color.trim(),
        actualSheinPriceRm: buyingRm,
      });
      onOpenChange(false);
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fetch SHEIN item details</DialogTitle>
          <DialogDescription>Enter a product URL or numeric product ID, then choose the image to save.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={fetchProduct}>
          <Input className="min-w-0" onChange={(event) => setQuery(event.target.value)} placeholder="Paste a SHEIN URL or enter a product ID" required value={query} />
          <Button className="gap-2 bg-emerald-700 hover:bg-emerald-800 sm:w-auto" disabled={isFetching || isApplying} type="submit">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isFetching ? "Fetching…" : "Fetch"}
          </Button>
        </form>

        {isFetching ? (
          <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Loader2 className="h-6 w-6 animate-spin" /></span>
            <p className="text-sm font-medium">Fetching product details from SHEIN…</p>
          </div>
        ) : null}

        {product && !isFetching ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/10 p-4">
              <p className="font-semibold text-slate-950">{product.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">SKU: {product.sku ?? "Not returned"}</p>
              <p className="text-sm text-muted-foreground">{product.priceFormatted ?? "Price not returned"}</p>
            </div>

            <div className="space-y-2">
              <Label>Choose an image</Label>
              {product.images.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {product.images.map((image, index) => (
                    <button
                      className={cn("relative overflow-hidden rounded-xl border-2 bg-muted", selectedImage === image ? "border-emerald-600 ring-2 ring-emerald-100" : "border-transparent")}
                      key={`${image}-${index}`}
                      onClick={() => setSelectedImage(image)}
                      type="button"
                    >
                      <img alt={`${product.title} ${index + 1}`} className="aspect-square w-full object-cover" src={image} />
                      {selectedImage === image ? <span className="absolute right-1 top-1 rounded-full bg-emerald-600 p-1 text-white"><Check className="h-3 w-3" /></span> : null}
                    </button>
                  ))}
                </div>
              ) : <p className="text-sm text-amber-700">No images were returned for this product.</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Size</Label><Input onChange={(event) => setSize(event.target.value)} placeholder="Enter manually" value={size} /></div>
              <div className="space-y-1.5"><Label>Color</Label><Input onChange={(event) => setColor(event.target.value)} placeholder="Enter manually" value={color} /></div>
              <div className="space-y-1.5"><Label>Buying price (RM)</Label><Input min="0" onChange={(event) => setBuyingRm(event.target.value)} placeholder="Enter RM price" step="0.01" type="number" value={buyingRm} /></div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button className="sm:w-auto" disabled={isApplying} onClick={() => onOpenChange(false)} type="button" variant="outline">Cancel</Button>
          <Button className="gap-2 bg-emerald-700 hover:bg-emerald-800 sm:w-auto" disabled={!product || !selectedImage || isApplying} onClick={() => void applyDetails()} type="button">
            {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isApplying ? "Saving item…" : applyLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
