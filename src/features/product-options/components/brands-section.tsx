import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { BrandsOptionsTable } from "./brands-options-table";
import { ProductOptionsEmptyState } from "./product-options-empty-state";
import { ProductOptionsMobileCardList } from "./product-options-mobile-card-list";
import { ProductOptionsSectionCard } from "./product-options-section-card";
import type { ProductOptionItemView } from "../types/product-options";

export function BrandsSection({
  brands,
  isLoading,
  onAdd,
  onEdit,
  onToggleStatus,
}: {
  brands: ProductOptionItemView[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: ProductOptionItemView) => void;
  onToggleStatus: (item: ProductOptionItemView) => void;
}) {
  return (
    <ProductOptionsSectionCard
      actionLabel="Add Brand"
      description="Brands are reusable product labels shown in product dropdowns."
      onAdd={onAdd}
      title="Brands"
    >
      {isLoading ? (
        <>
          <TableSkeleton columns={4} rows={5} />
          <CardListSkeleton cards={3} />
        </>
      ) : brands.length === 0 ? (
        <ProductOptionsEmptyState
          addLabel="Add Brand"
          message="No brands yet. Add your first brand."
          onAdd={onAdd}
        />
      ) : (
        <>
          <BrandsOptionsTable brands={brands} onEdit={onEdit} onToggleStatus={onToggleStatus} />
          <ProductOptionsMobileCardList
            items={brands}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
          />
        </>
      )}
    </ProductOptionsSectionCard>
  );
}
