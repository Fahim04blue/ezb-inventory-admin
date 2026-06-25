import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { CategoriesOptionsTable } from "./categories-options-table";
import { ProductOptionsEmptyState } from "./product-options-empty-state";
import { ProductOptionsMobileCardList } from "./product-options-mobile-card-list";
import { ProductOptionsSectionCard } from "./product-options-section-card";
import type { ProductOptionItemView } from "../types/product-options";

export function CategoriesSection({
  categories,
  isLoading,
  onAdd,
  onEdit,
  onToggleStatus,
}: {
  categories: ProductOptionItemView[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: ProductOptionItemView) => void;
  onToggleStatus: (item: ProductOptionItemView) => void;
}) {
  return (
    <ProductOptionsSectionCard
      actionLabel="Add Category"
      description="Categories organize products into clean predefined groups."
      onAdd={onAdd}
      title="Categories"
    >
      {isLoading ? (
        <>
          <TableSkeleton columns={4} rows={5} />
          <CardListSkeleton cards={3} />
        </>
      ) : categories.length === 0 ? (
        <ProductOptionsEmptyState
          addLabel="Add Category"
          message="No categories yet. Add your first category."
          onAdd={onAdd}
        />
      ) : (
        <>
          <CategoriesOptionsTable
            categories={categories}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
          />
          <ProductOptionsMobileCardList
            items={categories}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
          />
        </>
      )}
    </ProductOptionsSectionCard>
  );
}
