import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { ArrowDownToLine, ChevronDown, ChevronUp, CreditCard, MoreHorizontal, Pencil } from "lucide-react";
import { useState } from "react";
import { PaymentStatusBadge } from "./payment-status-badge";
import { PurchaseExpandedDetails } from "./purchase-expanded-details";
import { PurchaseItemChips } from "./purchase-item-chips";
import { PurchaseStatusBadge } from "./purchase-status-badge";
import { type PurchaseView } from "../types/purchase.types";

function canReceiveStock(purchase: PurchaseView) {
  if (purchase.status === "CANCELLED") {
    return false;
  }

  return purchase.items.some((item) => item.receivedQuantity < item.quantity);
}

function PurchaseActionsMenu({
  purchase,
  onEdit,
  onReceiveStock,
  onUpdatePayment,
}: {
  purchase: PurchaseView;
  onEdit?: (p: PurchaseView) => void;
  onReceiveStock?: (p: PurchaseView) => void;
  onUpdatePayment?: (p: PurchaseView) => void;
}) {
  const [open, setOpen] = useState(false);

  function runAction(action?: (purchase: PurchaseView) => void) {
    setOpen(false);
    action?.(purchase);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Purchase actions"
          variant="outline"
          className="h-7 w-7 border-stone-200 bg-card p-0 hover:bg-stone-100"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-3.5 w-3.5 text-stone-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-[70] w-48 rounded-xl border-stone-200 bg-white p-1 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-1">
          <Button
            className="h-9 w-full justify-start rounded-lg border-transparent bg-transparent px-2 text-sm shadow-none hover:bg-stone-50"
            onClick={() => runAction(onEdit)}
            variant="outline"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            className="h-9 w-full justify-start rounded-lg border-transparent bg-transparent px-2 text-sm shadow-none hover:bg-stone-50"
            onClick={() => runAction(onUpdatePayment)}
            variant="outline"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Update Payment
          </Button>
          {canReceiveStock(purchase) ? (
            <Button
              className="h-9 w-full justify-start rounded-lg border-transparent bg-transparent px-2 text-sm shadow-none hover:bg-stone-50"
              onClick={() => runAction(onReceiveStock)}
              variant="outline"
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Receive Stock
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PurchasesTable({
  purchases,
  onEdit,
  onReceiveStock,
  onUpdatePayment,
}: {
  purchases: PurchaseView[];
  onEdit?: (p: PurchaseView) => void;
  onReceiveStock?: (p: PurchaseView) => void;
  onUpdatePayment?: (p: PurchaseView) => void;
}) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  function toggleRow(purchaseId: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(purchaseId)) next.delete(purchaseId);
      else next.add(purchaseId);
      return next;
    });
  }

  return (
    <div className="hidden w-full min-w-0 overflow-hidden rounded-3xl border border-stone-200 bg-card shadow-sm md:block">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto_auto] gap-3 border-b border-stone-200 bg-stone-100/95 px-4 py-3 text-xs font-semibold text-stone-800">
            <div className="uppercase tracking-[0.08em]">Ref</div>
            <div>Supplier</div>
            <div>Items Purchased</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Product</div>
            <div className="text-right">Cargo</div>
            <div className="text-right">Other</div>
            <div className="text-right">Total Landed</div>
            <div className="text-center">Status</div>
            <div className="text-center">Supplier Payment</div>
            <div>Date</div>
            <div className="text-right">Actions</div>
            <div className="w-6" />
          </div>

          <div className="divide-y divide-stone-200/90">
            {purchases.map((purchase) => {
              const isExpanded = expandedRows.has(purchase.id);
              const totalQty = purchase.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div key={purchase.id} className="min-w-0">
                  <div
                    className={cn(
                      "grid cursor-pointer grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 transition-colors",
                      isExpanded
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "odd:bg-card even:bg-stone-50/55 hover:bg-stone-100/85",
                    )}
                    onClick={() => toggleRow(purchase.id)}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-stone-950">{purchase.referenceNumber}</div>
                      <div className="mt-0.5 text-[11px] text-stone-500">#{purchase.id}</div>
                    </div>
                    <div className="truncate text-[13px] text-stone-700">{purchase.supplier?.name || "Unknown"}</div>
                    <PurchaseItemChips items={purchase.items} />
                    <div className="text-right text-[13px] font-semibold text-stone-900">{totalQty}</div>
                    <div className="text-right text-[13px] text-stone-800">{formatCurrency(Number(purchase.productSubtotalBdt))}</div>
                    <div className="text-right text-[13px] text-sky-800">{formatCurrency(Number(purchase.cargoChargeBdt || 0))}</div>
                    <div className="text-right text-[13px] text-stone-600">{formatCurrency(Number(purchase.otherImportCostBdt || 0))}</div>
                    <div className="text-right">
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100/90 px-2.5 py-1 text-[12px] font-bold text-emerald-900">
                        {formatCurrency(Number(purchase.totalLandedCostBdt))}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <PurchaseStatusBadge status={purchase.status} />
                    </div>
                    <div className="flex justify-center">
                      <PaymentStatusBadge status={purchase.paymentStatus} />
                    </div>
                    <div className="text-[12px] text-stone-600">{formatDate(purchase.purchaseDate)}</div>
                    <div className="text-right">
                      <PurchaseActionsMenu
                        onEdit={onEdit}
                        onReceiveStock={onReceiveStock}
                        onUpdatePayment={onUpdatePayment}
                        purchase={purchase}
                      />
                    </div>
                    <div className="flex items-center justify-center text-stone-500">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && <PurchaseExpandedDetails purchase={purchase} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
