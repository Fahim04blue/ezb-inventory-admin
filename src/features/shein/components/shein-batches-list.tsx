import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { TableSkeleton } from "@/components/common/table-skeleton";
import type { SheinBatchView } from "../types/shein.types";
import { SheinBatchMobileCardList } from "./shein-batch-mobile-card-list";
import { SheinBatchesTable } from "./shein-batches-table";
import { SheinEmptyState } from "./shein-empty-state";

type SheinBatchesListProps = {
  batches: SheinBatchView[];
  isLoading: boolean;
  isMutating?: boolean;
  selectedBatchIds?: string[];
  selectedVisibleReceivableCount?: number;
  visibleReceivableBatchCount?: number;
  onView: (batch: SheinBatchView) => void;
  onAddItem: (batch: SheinBatchView) => void;
  onMarkReceived: (batch: SheinBatchView) => void;
  onEdit: (batch: SheinBatchView) => void;
  onDelete: (batch: SheinBatchView) => void;
  onToggleSelectBatch?: (batchId: string) => void;
  onSelectAllReceivable?: (checked: boolean) => void;
};

export function SheinBatchesList({
  batches,
  isLoading,
  isMutating,
  selectedBatchIds,
  selectedVisibleReceivableCount,
  visibleReceivableBatchCount,
  onView,
  onAddItem,
  onMarkReceived,
  onEdit,
  onDelete,
  onToggleSelectBatch,
  onSelectAllReceivable,
}: SheinBatchesListProps) {
  if (isLoading) {
    return (
      <>
        <TableSkeleton columns={8} rows={6} />
        <CardListSkeleton cards={4} />
      </>
    );
  }

  if (!batches.length) {
    return <SheinEmptyState message="No SHEIN batches found." />;
  }

  return (
    <>
      <SheinBatchesTable
        batches={batches}
        isMutating={isMutating}
        onAddItem={onAddItem}
        onDelete={onDelete}
        onEdit={onEdit}
        onMarkReceived={onMarkReceived}
        onSelectAllReceivable={onSelectAllReceivable}
        onToggleSelectBatch={onToggleSelectBatch}
        onView={onView}
        selectedBatchIds={selectedBatchIds}
        selectedVisibleReceivableCount={selectedVisibleReceivableCount}
        visibleReceivableBatchCount={visibleReceivableBatchCount}
      />
      <SheinBatchMobileCardList batches={batches} onOpen={onView} />
    </>
  );
}
