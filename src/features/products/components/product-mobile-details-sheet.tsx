"use client";

import { Package2, Pencil, Power, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProductStatusBadge } from "./product-status-badge";
import { type ProductVariantView, type ProductView } from "../types/product";
import { getPriceRange, getTotalStock, getVariantStockStatus } from "../utils/product-utils";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-1 text-[11px]">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-medium text-stone-900">{value}</span>
    </div>
  );
}

function VariantCard({
  product,
  variant,
  onEditVariant,
  onToggleVariantStatus,
}: {
  product: ProductView;
  variant: ProductVariantView;
  onEditVariant: (product: ProductView, variant: ProductVariantView) => void;
  onToggleVariantStatus: (variant: ProductVariantView) => void;
}) {
  const stockStatus = getVariantStockStatus(variant);

  return (
    <div className="rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-950">
            {variant.name}
          </p>
          <p className="mt-1 text-[11px] text-stone-500">
            SKU: {variant.sku || "Not set"}
          </p>
        </div>
        <ProductStatusBadge isActive={variant.isActive} />
      </div>

      <div className="mt-3 rounded-[18px] border border-stone-200 bg-[#fffdf8] p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${stockStatus.className}`}>
            {stockStatus.label}
          </span>
        </div>

        <div className="mt-2 grid gap-x-4 gap-y-1 min-[390px]:grid-cols-2">
          <InfoRow label="Stock" value={variant.currentStock.toString()} />
          <InfoRow label="Low Stock" value={variant.lowStockAlert?.toString() || "Not set"} />
          <InfoRow label="Price" value={variant.defaultSellingPrice || "Not set"} />
          <InfoRow
            label="Size"
            value={
              variant.productSizeValue
                ? `${variant.productSizeValue} ${variant.productSizeUnit ?? ""}`.trim()
                : "Not set"
            }
          />
          <InfoRow
            label="Weight"
            value={variant.shippingWeightKg ? `${variant.shippingWeightKg} kg` : "Not set"}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          className="h-9 rounded-xl border-stone-200 bg-white text-[13px] text-stone-700"
          onClick={() => onEditVariant(product, variant)}
          type="button"
          variant="outline"
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit Variant
        </Button>
        <Button
          className="h-9 rounded-xl border-stone-200 bg-white text-[13px] text-stone-700"
          onClick={() => onToggleVariantStatus(variant)}
          type="button"
          variant="outline"
        >
          <Power className="mr-1.5 h-3.5 w-3.5" />
          {variant.isActive ? "Deactivate" : "Activate"}
        </Button>
      </div>
    </div>
  );
}

export function ProductMobileDetailsSheet({
  open,
  product,
  onClose,
  onEditProduct,
  onToggleProductStatus,
  onAddVariant,
  onEditVariant,
  onToggleVariantStatus,
}: {
  open: boolean;
  product: ProductView | null;
  onClose: () => void;
  onEditProduct: (product: ProductView) => void;
  onToggleProductStatus: (product: ProductView) => void;
  onAddVariant: (product: ProductView) => void;
  onEditVariant: (product: ProductView, variant: ProductVariantView) => void;
  onToggleVariantStatus: (variant: ProductVariantView) => void;
}) {
  if (!product) {
    return null;
  }

  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
      <DialogContent
        className="left-0 top-auto bottom-0 z-[120] h-[78dvh] max-h-[78dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-[30px] border-stone-200 bg-[#fffdf8] p-0 shadow-[0_-18px_48px_rgba(15,23,42,0.22)]"
        showCloseButton={false}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-stone-200 px-4 pb-3 pt-3">
            <div className="mx-auto h-1.5 w-14 rounded-full bg-stone-300" />
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="text-[1.1rem] font-semibold tracking-tight text-stone-950">
                  Product Details
                </DialogTitle>
                <p className="mt-1 text-[11px] text-stone-500">
                  {[product.brand?.name, product.category?.name].filter(Boolean).join(" • ") ||
                    "No brand/category"}
                </p>
              </div>
              <Button
                className="h-9 w-9 rounded-full border-stone-200 bg-white px-0 text-stone-600"
                onClick={onClose}
                type="button"
                variant="outline"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
            <div className="space-y-3">
              <div className="rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-1 rounded-full bg-emerald-700" />
                      <p className="truncate text-base font-semibold tracking-tight text-stone-950">
                        {product.name}
                      </p>
                    </div>
                    {product.description ? (
                      <p className="mt-2 pl-3 text-[11px] leading-5 text-stone-500">
                        {product.description}
                      </p>
                    ) : null}
                  </div>
                  <ProductStatusBadge isActive={product.isActive} />
                </div>

                <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-[18px] border border-stone-200 bg-[#fffdf8]">
                  <div className="min-w-0 px-3 py-3 text-center">
                    <p className="text-[10px] text-stone-500">Variants</p>
                    <p className="mt-1 text-base font-semibold text-stone-950">
                      {product.variants.length}
                    </p>
                  </div>
                  <div className="min-w-0 border-x border-stone-200 px-3 py-3 text-center">
                    <p className="text-[10px] text-stone-500">Total Stock</p>
                    <p className="mt-1 text-base font-semibold text-stone-950">
                      {getTotalStock(product)}
                    </p>
                  </div>
                  <div className="min-w-0 px-3 py-3 text-center">
                    <p className="text-[10px] text-stone-500">Price Range</p>
                    <p className="mt-1 truncate text-sm font-semibold text-stone-950">
                      {getPriceRange(product)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">Variants</p>
                    <p className="text-[11px] text-stone-500">
                      Manage all sellable options for this product.
                    </p>
                  </div>
                  <Button
                    className="h-9 rounded-xl border-stone-200 bg-white px-3 text-[13px] text-stone-700"
                    onClick={() => onAddVariant(product)}
                    type="button"
                    variant="outline"
                  >
                    <Package2 className="mr-1.5 h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </div>

              {product.variants.map((variant) => (
                <VariantCard
                  key={variant.id}
                  onEditVariant={onEditVariant}
                  onToggleVariantStatus={onToggleVariantStatus}
                  product={product}
                  variant={variant}
                />
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-stone-200 bg-[#fffdf8] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="h-10 rounded-xl border-emerald-200 bg-white text-[13px] text-emerald-800"
                onClick={() => onEditProduct(product)}
                type="button"
                variant="outline"
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit Product
              </Button>
              <Button
                className="h-10 rounded-xl border-stone-200 bg-white text-[13px] text-stone-700"
                onClick={() => onToggleProductStatus(product)}
                type="button"
                variant="outline"
              >
                <Power className="mr-1.5 h-3.5 w-3.5" />
                {product.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
