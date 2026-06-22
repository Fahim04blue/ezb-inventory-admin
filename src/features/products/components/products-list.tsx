import { TableSkeleton } from "@/components/common/table-skeleton";
import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { ProductEmptyState } from "./product-empty-state";
import { ProductsTable } from "./products-table";
import { ProductMobileCardList } from "./product-mobile-card-list";
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
      <>
        <TableSkeleton columns={5} rows={6} />
        <CardListSkeleton cards={4} />
      </>
    );
  }

  if (products.length === 0) {
    return <ProductEmptyState />;
  }

  return (
    <>
      <ProductsTable
        products={products}
        onEditProduct={onEditProduct}
        onToggleProductStatus={onToggleProductStatus}
        onEditVariant={onEditVariant}
        onAddVariant={onAddVariant}
        onToggleVariantStatus={onToggleVariantStatus}
      />
      <ProductMobileCardList
        products={products}
        onEditProduct={onEditProduct}
        onToggleProductStatus={onToggleProductStatus}
        onEditVariant={onEditVariant}
        onAddVariant={onAddVariant}
        onToggleVariantStatus={onToggleVariantStatus}
      />
    </>
  );
}
