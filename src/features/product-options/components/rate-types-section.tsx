import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { TableSkeleton } from "@/components/common/table-skeleton";
import type { RateTypeView } from "@/features/rate-types/types/rate-type";
import { ProductOptionsEmptyState } from "./product-options-empty-state";
import { ProductOptionsMobileCardList } from "./product-options-mobile-card-list";
import { ProductOptionsSectionCard } from "./product-options-section-card";
import { RateTypesOptionsTable } from "./rate-types-options-table";

export function RateTypesSection({
  rateTypes,
  isLoading,
  onAdd,
  onEdit,
  onToggleStatus,
}: {
  rateTypes: RateTypeView[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: RateTypeView) => void;
  onToggleStatus: (item: RateTypeView) => void;
}) {
  return (
    <ProductOptionsSectionCard
      actionLabel="Add Rate Type"
      description="Rate types classify reusable pricing and exchange labels. Actual rate history still belongs in Currency Rates."
      onAdd={onAdd}
      title="Rate Types"
    >
      {isLoading ? (
        <>
          <TableSkeleton columns={5} rows={5} />
          <CardListSkeleton cards={3} />
        </>
      ) : rateTypes.length === 0 ? (
        <ProductOptionsEmptyState
          addLabel="Add Rate Type"
          message="No rate types yet. Add your first rate type."
          onAdd={onAdd}
        />
      ) : (
        <>
          <RateTypesOptionsTable
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            rateTypes={rateTypes}
          />
          <ProductOptionsMobileCardList
            items={rateTypes}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
          />
        </>
      )}
    </ProductOptionsSectionCard>
  );
}
