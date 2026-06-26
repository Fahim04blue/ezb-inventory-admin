"use client";

import { Plus } from "lucide-react";

import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { Button } from "@/components/ui/button";
import { ProductMobileCard } from "./product-mobile-card";
import { ProductMobileDetailsSheet } from "./product-mobile-details-sheet";
import { type ProductVariantView, type ProductView } from "../types/product";

export function ProductsMobileView({
  isLoading,
  products,
  selectedProduct,
  onSelectProduct,
  onCloseDetails,
  onAddProduct,
  onEditProduct,
  onToggleProductStatus,
  onAddVariant,
  onEditVariant,
  onToggleVariantStatus,
}: {
  isLoading: boolean;
  products: ProductView[];
  selectedProduct: ProductView | null;
  onSelectProduct: (product: ProductView) => void;
  onCloseDetails: () => void;
  onAddProduct: () => void;
  onEditProduct: (product: ProductView) => void;
  onToggleProductStatus: (product: ProductView) => void;
  onAddVariant: (product: ProductView) => void;
  onEditVariant: (product: ProductView, variant: ProductVariantView) => void;
  onToggleVariantStatus: (variant: ProductVariantView) => void;
}) {
  return (
    <div className="space-y-4 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage products, variants, and current stock.
          </p>
        </div>
        <Button
          className="h-10 w-auto shrink-0 rounded-xl bg-emerald-800 px-3.5 text-white"
          onClick={onAddProduct}
          type="button"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {isLoading ? (
        <CardListSkeleton cards={4} />
      ) : products.length ? (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductMobileCard
              key={product.id}
              onEdit={onEditProduct}
              onToggleStatus={onToggleProductStatus}
              onView={onSelectProduct}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/80 bg-white px-5 py-8 text-center shadow-sm">
          <h2 className="font-semibold text-slate-950">No products found</h2>
          <p className="mt-1 text-xs text-slate-500">
            Add a product to start managing variants and stock.
          </p>
        </div>
      )}

      <ProductMobileDetailsSheet
        onAddVariant={onAddVariant}
        onClose={onCloseDetails}
        onEditProduct={onEditProduct}
        onEditVariant={onEditVariant}
        onToggleProductStatus={onToggleProductStatus}
        onToggleVariantStatus={onToggleVariantStatus}
        open={selectedProduct !== null}
        product={selectedProduct}
      />
    </div>
  );
}
