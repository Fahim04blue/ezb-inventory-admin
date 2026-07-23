import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { TableSkeleton } from "@/components/common/table-skeleton";
import type { SheinCustomerOrderGroup } from "../types/shein.types";
import { SheinCustomerOrdersMobileCardList } from "./shein-customer-orders-mobile-card-list";
import { SheinCustomerOrdersTable } from "./shein-customer-orders-table";
import { SheinEmptyState } from "./shein-empty-state";

export function SheinCustomerOrdersList({
  groups,
  isLoading,
  onOpen,
  onCreate,
  onReverse,
  isReversingKey,
}: {
  groups: SheinCustomerOrderGroup[];
  isLoading: boolean;
  onOpen: (group: SheinCustomerOrderGroup) => void;
  onCreate: (group: SheinCustomerOrderGroup) => void;
  onReverse: (group: SheinCustomerOrderGroup) => void;
  isReversingKey: string | null;
}) {
  if (isLoading) {
    return (
      <>
        <TableSkeleton columns={9} rows={6} />
        <CardListSkeleton cards={4} />
      </>
    );
  }

  if (!groups.length) {
    return <SheinEmptyState message="No SHEIN customer orders found." />;
  }

  return (
    <>
      <SheinCustomerOrdersTable groups={groups} isReversingKey={isReversingKey} onCreate={onCreate} onOpen={onOpen} onReverse={onReverse} />
      <SheinCustomerOrdersMobileCardList groups={groups} isReversingKey={isReversingKey} onCreate={onCreate} onOpen={onOpen} onReverse={onReverse} />
    </>
  );
}
