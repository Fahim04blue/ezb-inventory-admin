import { TableSkeleton } from "@/components/common/table-skeleton";
import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { PurchaseEmptyState } from "./purchase-empty-state";
import { PurchasesTable } from "./purchases-table";
import { PurchaseMobileCardList } from "./purchase-mobile-card-list";
import { type PurchaseView } from "../types/purchase.types";

export function PurchasesList({
  isLoading,
  purchases,
  onAdd,
  onEdit,
  onReceiveStock,
  onUpdatePayment,
}: {
  isLoading: boolean;
  purchases: PurchaseView[];
  onAdd: () => void;
  onEdit: (purchase: PurchaseView) => void;
  onReceiveStock: (purchase: PurchaseView) => void;
  onUpdatePayment: (purchase: PurchaseView) => void;
}) {
  if (isLoading) {
    return (
      <>
        <TableSkeleton columns={6} rows={5} />
        <CardListSkeleton cards={3} />
      </>
    );
  }

  if (purchases.length === 0) {
    return <PurchaseEmptyState onAdd={onAdd} />;
  }

  return (
    <>
      <PurchasesTable
        purchases={purchases}
        onEdit={onEdit}
        onReceiveStock={onReceiveStock}
        onUpdatePayment={onUpdatePayment}
      />
      <PurchaseMobileCardList
        purchases={purchases}
        onEdit={onEdit}
        onReceiveStock={onReceiveStock}
        onUpdatePayment={onUpdatePayment}
      />
    </>
  );
}
