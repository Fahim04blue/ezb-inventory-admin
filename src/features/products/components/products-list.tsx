import { TableSkeleton } from "@/components/common/table-skeleton";
import { ProductEmptyState } from "./product-empty-state";
import { ProductsTable } from "./products-table";
import { type ProductView, type ProductVariantView } from "../types/product";

export function ProductsList({
  isLoading,
  products,
  onEditProduct,
  onToggleProductStatus,
  onEditVariant,
  onAddVariant,
  onToggleVariantStatus,
}: {
  isLoading: boolean;
  products: ProductView[];
  onEditProduct: (product: ProductView) => void;
  onToggleProductStatus: (product: ProductView) => void;
  onEditVariant: (product: ProductView, variant: ProductVariantView) => void;
  onAddVariant: (product: ProductView) => void;
  onToggleVariantStatus: (variant: ProductVariantView) => void;
}) {
  if (isLoading) {
    return (
      <div className="hidden md:block">
        <TableSkeleton columns={5} rows={6} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="hidden md:block">
        <ProductEmptyState />
      </div>
    );
  }

  return (
    <div className="hidden md:block">
      <ProductsTable
        products={products}
        onEditProduct={onEditProduct}
        onToggleProductStatus={onToggleProductStatus}
        onEditVariant={onEditVariant}
        onAddVariant={onAddVariant}
        onToggleVariantStatus={onToggleVariantStatus}
      />
    </div>
  );
}
