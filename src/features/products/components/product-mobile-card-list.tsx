import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductStatusBadge } from "./product-status-badge";
import { type ProductView, type ProductVariantView } from "../types/product";
import {
  getTotalStock,
  getPriceRange,
  getVariantStockStatus,
} from "../utils/product-utils";

export function ProductMobileCardList({
  products,
  onEditProduct,
  onToggleProductStatus,
  onEditVariant,
  onToggleVariantStatus,
}: {
  products: ProductView[];
  onEditProduct: (product: ProductView) => void;
  onToggleProductStatus: (product: ProductView) => void;
  onEditVariant: (product: ProductView, variant: ProductVariantView) => void;
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
    <div className="grid gap-4 md:hidden">
      {products.map((product) => {
        const isExpanded = expandedRows.has(product.id);
        const totalStock = getTotalStock(product);
        const priceRange = getPriceRange(product);

        return (
          <Card key={product.id} className="overflow-hidden">
            <CardContent
              className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleRow(product.id)}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-base">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[product.brand?.name, product.category?.name].filter(Boolean).join(" · ") ||
                        "No brand/category"}
                    </p>
                  </div>
                  <ProductStatusBadge isActive={product.isActive} />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((variant) => {
                    const statusInfo = getVariantStockStatus(variant);
                    return (
                      <div
                        key={variant.id}
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors ${statusInfo.className}`}
                        title={`${statusInfo.label} - ${variant.name}`}
                      >
                        <span className="max-w-[120px] truncate">{variant.name}</span>
                        <span className="ml-1 opacity-70">: {variant.currentStock}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
                  <span>Total stock: <span className="font-medium text-foreground">{totalStock}</span></span>
                  <span>Price: <span className="font-medium text-foreground">{priceRange}</span></span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <div className="flex gap-2">
                    <Button
                      className="h-8 px-3 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProduct(product);
                      }}
                      variant="outline"
                    >
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
                      {product.isActive ? "Deact." : "Act."}
                    </Button>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </div>
            </CardContent>

            {isExpanded && (
              <div className="bg-muted/20 border-t border-border/50 p-4 space-y-3">
                {product.variants.map((variant) => (
                  <div className="rounded-2xl border border-border bg-background p-4 shadow-sm" key={variant.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{variant.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">SKU: {variant.sku || "Not set"}</p>
                      </div>
                      <ProductStatusBadge isActive={variant.isActive} />
                    </div>
                    
                    <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>Stock: {variant.currentStock}</p>
                      <p>Low stock: {variant.lowStockAlert ?? "Not set"}</p>
                      <p>Price: {variant.defaultSellingPrice ?? "Not set"}</p>
                      <p>Size: {variant.productSizeValue ? `${variant.productSizeValue} ${variant.productSizeUnit ?? ""}`.trim() : "Not set"}</p>
                      <p>Weight: {variant.shippingWeightKg ? `${variant.shippingWeightKg} kg` : "Not set"}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        className="h-8 px-3 text-xs bg-muted/50 hover:bg-muted"
                        onClick={() => onEditVariant(product, variant)}
                        variant="outline"
                      >
                        Edit Variant
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
            )}
          </Card>
        );
      })}
    </div>
  );
}
