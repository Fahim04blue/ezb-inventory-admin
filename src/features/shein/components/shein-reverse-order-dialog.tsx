"use client";

import { AlertTriangle, Loader2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SheinCustomerOrderGroup } from "../types/shein.types";

export function SheinReverseOrderDialog({
  group,
  isReversing,
  onClose,
  onConfirm,
}: {
  group: SheinCustomerOrderGroup | null;
  isReversing: boolean;
  onClose: () => void;
  onConfirm: (group: SheinCustomerOrderGroup) => void;
}) {
  const movedItems = group?.items.filter((item) => item.status === "MOVED_TO_ORDER") ?? [];

  return (
    <Dialog open={group !== null} onOpenChange={(open) => { if (!open && !isReversing) onClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isReversing}>
        <DialogHeader className="text-left">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>Reverse completed SHEIN order?</DialogTitle>
          <DialogDescription>
            Review the effect of reversing this order before continuing.
          </DialogDescription>
        </DialogHeader>

        {group ? (
          <div className="space-y-3">
            <div className="rounded-xl border bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Customer</span><strong className="text-right text-slate-900">{group.customerName}</strong></div>
              <div className="mt-2 flex items-center justify-between gap-4"><span className="text-muted-foreground">Items affected</span><strong className="text-slate-900">{movedItems.length}</strong></div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
              <p className="font-semibold">After reversal:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-900">
                <li>The generated normal order will be cancelled.</li>
                <li>SHEIN items will return to Ready for Delivery.</li>
                <li>Saved costing remains available for correction.</li>
              </ul>
            </div>
          </div>
        ) : null}

        <DialogFooter className="mt-2 sm:justify-end">
          <Button disabled={isReversing} onClick={onClose} type="button" variant="outline">Cancel</Button>
          <Button className="gap-2 bg-amber-600 text-white hover:bg-amber-700" disabled={isReversing || !group || !movedItems.length} onClick={() => group && onConfirm(group)} type="button">
            {isReversing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
            {isReversing ? "Reversing…" : "Reverse Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
