import { useState } from "react";
import { Edit, Power, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductVariantThumbnail } from "@/components/common/product-variant-thumbnail";
import { ProductStatusBadge } from "./product-status-badge";
import { type ProductView, type ProductVariantView } from "../types/product";

import {
  getTotalStock,
  getPriceRange,
  getVariantStockStatus,
  getActiveVariantCount,
  getInactiveVariantCount,
} from "../utils/product-utils";

export function ProductsTable({
  products,
  onEditProduct,
  onToggleProductStatus,
  onEditVariant,
  onAddVariant,
  onToggleVariantStatus,
}: {
  products: ProductView[];
  onEditProduct: (product: ProductView) => void;
  onToggleProductStatus: (product: ProductView) => void;
  onEditVariant: (product: ProductView, variant: ProductVariantView) => void;
  onAddVariant: (product: ProductView) => void;
  onToggleVariantStatus: (variant: ProductVariantView) => void;
}) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  function toggleRow(productId: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  return (
    <div className="hidden w-full min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] gap-4 border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
            <div>Product</div>
            <div>Variants / Stock</div>
            <div>Total Stock</div>
            <div>Price</div>
            <div>Status</div>
            <div>Actions</div>
            <div className="w-6" />
          </div>
      <div className="divide-y divide-border">
        {products.map((product) => {
          const isExpanded = expandedRows.has(product.id);
          const totalStock = getTotalStock(product);
          const priceRange = getPriceRange(product);
          const brandCategory = [product.brand?.name, product.category?.name]
            .filter(Boolean)
            .join(" · ");

          return (
            <div className="flex flex-col min-w-0" key={product.id}>
              <div
                className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleRow(product.id)}
              >
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {brandCategory || "No brand/category"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const statusInfo = getVariantStockStatus(variant);
                    return (
                      <div
                        key={variant.id}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs font-semibold transition-colors ${statusInfo.className}`}
                        title={`${statusInfo.label} - ${variant.name}`}
                      >
                        <ProductVariantThumbnail
                          imageUrl={variant.imageUrl}
                          alt={variant.name}
                          className="h-6 w-6 rounded"
                        />
                        <span className="max-w-[120px] truncate">{variant.name}</span>
                        <span className="ml-1 opacity-70">: {variant.currentStock}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{totalStock}</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{priceRange}</p>
                </div>
                <div>
                  <ProductStatusBadge isActive={product.isActive} />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="h-8 px-3 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProduct(product);
                    }}
                    variant="outline"
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    className="h-8 px-3 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleProductStatus(product);
                    }}
                    variant="outline"
                  >
                    <Power className="mr-2 h-3 w-3" />
                    {product.isActive ? "Deact." : "Act."}
                  </Button>
                </div>
                <div className="flex items-center justify-center text-muted-foreground">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              
              {isExpanded && (
                <div className="px-6 pb-5 pt-2 bg-muted/20 border-t border-border/50">
                  <div className="flex justify-end mb-4">
                    <Button className="h-8 px-3 text-xs" onClick={() => onAddVariant(product)} variant="outline">
                       Add Variant
                    </Button>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {product.variants.map((variant) => (
                      <div className="rounded-2xl border border-border bg-background p-4 shadow-sm" key={variant.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <ProductVariantThumbnail
                              imageUrl={variant.imageUrl}
                              alt={variant.name}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{variant.name}</p>
                              <p className="mt-1 text-sm text-muted-foreground">SKU: {variant.sku || "Not set"}</p>
                            </div>
                          </div>
                          <ProductStatusBadge isActive={variant.isActive} />
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <p>Current stock: {variant.currentStock}</p>
                          <p>Low stock alert: {variant.lowStockAlert ?? "Not set"}</p>
                          <p>Default price: {variant.defaultSellingPrice ?? "Not set"}</p>
                          <p>Size: {variant.productSizeValue ? `${variant.productSizeValue} ${variant.productSizeUnit ?? ""}`.trim() : "Not set"}</p>
                          <p>Shipping Weight: {variant.shippingWeightKg ? `${variant.shippingWeightKg} kg` : "Not set"}</p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            className="h-8 px-3 text-xs bg-muted/50 hover:bg-muted"
                            onClick={() => onEditVariant(product, variant)}
                            variant="outline"
                          >
                            Edit
                          </Button>
                          <Button
                            className="h-8 px-3 text-xs bg-muted/50 hover:bg-muted"
                            onClick={() => onToggleVariantStatus(variant)}
                            variant="outline"
                          >
                            {variant.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
        </div>
      </div>
    </div>
  );
}
