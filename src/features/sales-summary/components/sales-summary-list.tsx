import { TableSkeleton } from "@/components/common/table-skeleton";
import { SalesSummaryEmptyState } from "./sales-summary-empty-state";
import { SalesSummaryTable } from "./sales-summary-table";
import { SalesSummaryMobileCardList } from "./sales-summary-mobile-card-list";
import { type SalesSummaryView } from "../types/sales-summary.types";

export function SalesSummaryList({
  isLoading,
  salesSummaries,
  onAdd,
  onEdit,
  onToggleStatus,
}: {
  isLoading: boolean;
  salesSummaries: SalesSummaryView[];
  onAdd: () => void;
  onEdit: (salesSummary: SalesSummaryView) => void;
  onToggleStatus: (salesSummary: SalesSummaryView) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
        <TableSkeleton columns={8} rows={6} />
      </div>
    );
  }

  if (salesSummaries.length === 0) {
    return <SalesSummaryEmptyState onAdd={onAdd} />;
  }

  return (
    <>
      <div className="hidden sm:block">
        <SalesSummaryTable
          salesSummaries={salesSummaries}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      </div>
      <div className="block sm:hidden">
        <SalesSummaryMobileCardList
          salesSummaries={salesSummaries}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      </div>
    </>
  );
}
