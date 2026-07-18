"use client";

import { useState } from "react";
import { CheckCircle2, Edit, Eye, MoreHorizontal, PackagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SheinBatchItemStatus, SheinBatchStatus } from "@/lib/domain-enums";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SheinBatchView } from "../types/shein.types";
import { SheinStatusBadge } from "./shein-status-badge";

type SheinBatchesTableProps = {
  batches: SheinBatchView[];
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

export function canReceiveBatch(batch: SheinBatchView) {
  return batch.status !== SheinBatchStatus.RECEIVED && batch.status !== SheinBatchStatus.CANCELLED;
}

export function canManageBatchItems(batch: SheinBatchView) {
  return !batch.items?.length || batch.items.some((item) => item.status !== SheinBatchItemStatus.MOVED_TO_ORDER);
}

function SheinBatchActionsMenu({
  batch,
  onView,
  onAddItem,
  onMarkReceived,
  onEdit,
  onDelete,
}: {
  batch: SheinBatchView;
  onView: (batch: SheinBatchView) => void;
  onAddItem: (batch: SheinBatchView) => void;
  onMarkReceived: (batch: SheinBatchView) => void;
  onEdit: (batch: SheinBatchView) => void;
  onDelete: (batch: SheinBatchView) => void;
}) {
  const [open, setOpen] = useState(false);
  const canMarkReceived = canReceiveBatch(batch);
  const canManageItems = canManageBatchItems(batch);

  function runAction(action: (batch: SheinBatchView) => void) {
    setOpen(false);
    action(batch);
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button aria-label="Batch actions" className="h-8 w-8 rounded-lg px-0" variant="outline">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[70] w-44 rounded-xl bg-white p-1 shadow-xl">
        <div className="space-y-1">
          <Button className="h-9 w-full justify-start gap-2 rounded-lg border-transparent bg-transparent px-2 text-sm shadow-none hover:bg-muted" onClick={() => runAction(onView)} variant="outline">
            <Eye className="h-4 w-4" />
            View details
          </Button>
          {canManageItems ? (
            <Button className="h-9 w-full justify-start gap-2 rounded-lg border-transparent bg-transparent px-2 text-sm text-emerald-700 shadow-none hover:bg-emerald-50" onClick={() => runAction(onAddItem)} variant="outline">
              <PackagePlus className="h-4 w-4" />
              Manage items
            </Button>
          ) : null}
          {canMarkReceived ? (
            <Button className="h-9 w-full justify-start gap-2 rounded-lg border-transparent bg-transparent px-2 text-sm text-emerald-700 shadow-none hover:bg-emerald-50" onClick={() => runAction(onMarkReceived)} variant="outline">
              <CheckCircle2 className="h-4 w-4" />
              Mark as received
            </Button>
          ) : null}
          <Button className="h-9 w-full justify-start gap-2 rounded-lg border-transparent bg-transparent px-2 text-sm text-blue-700 shadow-none hover:bg-blue-50" onClick={() => runAction(onEdit)} variant="outline">
            <Edit className="h-4 w-4" />
            Edit batch
          </Button>
          <Button className="h-9 w-full justify-start gap-2 rounded-lg border-transparent bg-transparent px-2 text-sm text-red-700 shadow-none hover:bg-red-50" onClick={() => runAction(onDelete)} variant="outline">
            <Trash2 className="h-4 w-4" />
            Delete batch
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SheinBatchesTable({
  batches,
  isMutating = false,
  selectedBatchIds = [],
  selectedVisibleReceivableCount = 0,
  visibleReceivableBatchCount = 0,
  onView,
  onAddItem,
  onMarkReceived,
  onEdit,
  onDelete,
  onToggleSelectBatch,
  onSelectAllReceivable,
}: SheinBatchesTableProps) {
  const showBulkSelection = visibleReceivableBatchCount > 0;
  const allVisibleReceivableSelected =
    showBulkSelection && selectedVisibleReceivableCount === visibleReceivableBatchCount;
  const someVisibleReceivableSelected =
    showBulkSelection &&
    selectedVisibleReceivableCount > 0 &&
    selectedVisibleReceivableCount < visibleReceivableBatchCount;

  return (
    <div className="hidden overflow-x-auto rounded-2xl border bg-card shadow-sm md:block">
      <div className={cn("grid min-w-[1160px] gap-4 border-b px-5 py-4 text-sm font-semibold text-slate-800", showBulkSelection ? "grid-cols-[34px_minmax(0,1.1fr)_170px_190px_170px_130px_150px_110px_80px]" : "grid-cols-[minmax(0,1.1fr)_170px_190px_170px_130px_150px_110px_80px]")}>
        {showBulkSelection ? (
          <div>
            <input
              aria-label="Select all receivable SHEIN batches"
              checked={allVisibleReceivableSelected}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600"
              disabled={isMutating}
              onChange={(event) => onSelectAllReceivable?.(event.target.checked)}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someVisibleReceivableSelected;
                }
              }}
              type="checkbox"
            />
          </div>
        ) : null}
        <div>Batch Name</div>
        <div>SHEIN Order Number</div>
        <div>SHEIN Tracking Number</div>
        <div>Bank Rate (1 RM = X BDT)</div>
        <div>Order Total (RM)</div>
        <div>Order Total (BDT)</div>
        <div>Status</div>
        <div>Actions</div>
      </div>
      <div>
        {batches.map((batch) => {
          const canMarkReceived = canReceiveBatch(batch);
          const isSelected = selectedBatchIds.includes(batch.id);

          return (
          <div
            key={batch.id}
            className={cn(
              "grid min-w-[1160px] items-center gap-4 border-b px-5 py-4 text-sm last:border-b-0 hover:bg-muted/30",
              showBulkSelection ? "grid-cols-[34px_minmax(0,1.1fr)_170px_190px_170px_130px_150px_110px_80px]" : "grid-cols-[minmax(0,1.1fr)_170px_190px_170px_130px_150px_110px_80px]",
              isSelected && "bg-emerald-50/60",
            )}
          >
            {showBulkSelection ? (
              <div>
                <input
                  aria-label={`Select ${batch.batchName}`}
                  checked={isSelected}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-30"
                  disabled={!canMarkReceived || isMutating}
                  onChange={() => onToggleSelectBatch?.(batch.id)}
                  type="checkbox"
                />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="truncate font-semibold">{batch.batchName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {batch.notes || "No notes"}
              </p>
            </div>
            <div>{batch.sheinOrderNumbers || "-"}</div>
            <div>{batch.sheinTrackingNumber || "-"}</div>
            <div>{batch.bankRate ? `1 RM = ${formatNumber(batch.bankRate)} BDT` : "Pending"}</div>
            <div>RM {formatNumber(batch.totalRm)}</div>
            <div>{formatCurrency(batch.estimatedCustomerValue)}</div>
            <SheinStatusBadge status={batch.status} />
            <div>
              <SheinBatchActionsMenu batch={batch} onAddItem={onAddItem} onDelete={onDelete} onEdit={onEdit} onMarkReceived={onMarkReceived} onView={onView} />
            </div>
          </div>
          );
        })}
        <div className="flex min-w-[1160px] flex-col gap-3 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Showing 1 to {batches.length} of {batches.length} batch{batches.length === 1 ? "" : "es"}</p>
          <div className="flex items-center gap-2">
            <Button className="h-9 w-9 rounded-lg px-0" disabled variant="outline">‹</Button>
            <Button className="h-9 w-9 rounded-lg bg-emerald-700 px-0 hover:bg-emerald-800">1</Button>
            <Button className="h-9 w-9 rounded-lg px-0" disabled variant="outline">›</Button>
            <Button className="h-9 w-auto rounded-lg px-4" variant="outline">10 per page</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
