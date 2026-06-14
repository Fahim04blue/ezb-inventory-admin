import { TableSkeleton } from "@/components/common/table-skeleton";
import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { SupplierEmptyState } from "./supplier-empty-state";
import { SuppliersTable } from "./suppliers-table";
import { SupplierMobileCardList } from "./supplier-mobile-card-list";
import { type SupplierView } from "../types/supplier";

export function SuppliersList({
  isLoading,
  suppliers,
  onEdit,
  onToggleStatus,
}: {
  isLoading: boolean;
  suppliers: SupplierView[];
  onEdit: (supplier: SupplierView) => void;
  onToggleStatus: (supplier: SupplierView) => void;
}) {
  if (isLoading) {
    return (
      <>
        <TableSkeleton columns={4} rows={6} />
        <CardListSkeleton cards={4} />
      </>
    );
  }

  if (suppliers.length === 0) {
    return <SupplierEmptyState />;
  }

  return (
    <>
      <SuppliersTable
        suppliers={suppliers}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
      />
      <SupplierMobileCardList
        suppliers={suppliers}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
      />
    </>
  );
}
