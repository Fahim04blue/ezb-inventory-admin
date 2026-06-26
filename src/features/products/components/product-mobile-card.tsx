"use client";

import { ChevronRight, Pencil, Plus, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductStatusBadge } from "./product-status-badge";
import { type ProductView } from "../types/product";
import { getPriceRange, getTotalStock, getVariantStockStatus } from "../utils/product-utils";

export function ProductMobileCard({
  product,
  onView,
  onEdit,
  onToggleStatus,
}: {
  product: ProductView;
  onView: (product: ProductView) => void;
  onEdit: (product: ProductView) => void;
  onToggleStatus: (product: ProductView) => void;
}) {
  const totalStock = getTotalStock(product);
  const priceRange = getPriceRange(product);

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <button
            className="min-w-0 flex-1 text-left"
            onClick={() => onView(product)}
            type="button"
          >
            <span className="block truncate text-sm font-semibold text-slate-950">
              {product.name}
            </span>
            <span className="mt-1 block truncate text-xs text-slate-500">
              {[product.brand?.name, product.category?.name].filter(Boolean).join(" · ") ||
                "No brand/category"}
            </span>
          </button>
          <ProductStatusBadge isActive={product.isActive} />
        </div>

        <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-3">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] text-slate-500">Variants</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {product.variants.length}
            </p>
          </div>
          <div className="min-w-0 px-2">
            <p className="text-[10px] text-slate-500">Total Stock</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {totalStock}
            </p>
          </div>
          <div className="min-w-0 pl-2">
            <p className="text-[10px] text-slate-500">Price Range</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-950">
              {priceRange}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {product.variants.map((variant) => {
              const statusInfo = getVariantStockStatus(variant);

              return (
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] ${statusInfo.className}`}
                key={variant.id}
              >
                {variant.name} · {variant.currentStock}
              </span>
              );
            })}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50/40 px-3 py-2.5">
        <Button
          className="h-9 rounded-xl border-slate-200 bg-white px-2 text-xs shadow-none"
          onClick={() => onEdit(product)}
          type="button"
          variant="outline"
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          className="h-9 rounded-xl border-slate-200 bg-white px-2 text-xs shadow-none"
          onClick={() => onView(product)}
          type="button"
          variant="outline"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Details
        </Button>
        <Button
          className="h-9 rounded-xl border-slate-200 bg-white px-2 text-xs shadow-none"
          onClick={() => onToggleStatus(product)}
          type="button"
          variant="outline"
        >
          <Power className="mr-1.5 h-3.5 w-3.5" />
          {product.isActive ? "Disable" : "Enable"}
        </Button>
      </div>
    </article>
  );
}
