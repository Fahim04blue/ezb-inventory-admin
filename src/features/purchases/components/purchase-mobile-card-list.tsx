import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ArrowDownToLine, CreditCard, Pencil } from "lucide-react";
import { PaymentStatusBadge } from "./payment-status-badge";
import { PurchaseItemChips } from "./purchase-item-chips";
import { PurchaseStatusBadge } from "./purchase-status-badge";
import { type PurchaseView } from "../types/purchase.types";

function canReceiveStock(purchase: PurchaseView) {
  if (purchase.status === "CANCELLED") {
    return false;
  }

  return purchase.items.some((item) => item.receivedQuantity < item.quantity);
}

export function PurchaseMobileCardList({
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
  return (
    <div className="grid gap-4 md:hidden">
      {purchases.map((purchase) => {
        const totalQty = purchase.items.reduce((sum, item) => sum + item.quantity, 0);

        return (
          <div key={purchase.id} className="rounded-2xl border border-stone-200 bg-card p-5 shadow-sm">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="block truncate text-sm font-bold text-stone-950">{purchase.referenceNumber}</span>
                <p className="mt-1 truncate text-sm text-stone-700">{purchase.supplier?.name || "Unknown Supplier"}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <PurchaseStatusBadge status={purchase.status} />
                <PaymentStatusBadge status={purchase.paymentStatus} />
              </div>
            </div>

            <PurchaseItemChips items={purchase.items} className="mt-4" />

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-stone-500">Total Landed</p>
                <p className="mt-1 inline-flex rounded-full border border-emerald-200 bg-emerald-100/90 px-2.5 py-1 text-sm font-bold text-emerald-900">
                  {formatCurrency(Number(purchase.totalLandedCostBdt))}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Total Qty</p>
                <p className="font-semibold text-stone-900">{totalQty} pcs</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-stone-200 pt-4">
              <div className="text-xs text-stone-500">{formatDate(purchase.purchaseDate)}</div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  variant="outline"
                  className="h-8 border-stone-200 px-3 text-xs text-stone-700 hover:bg-stone-100"
                  onClick={() => onEdit?.(purchase)}
                >
                  <Pencil className="mr-2 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="h-8 border-stone-200 px-3 text-xs text-stone-700 hover:bg-stone-100"
                  onClick={() => onUpdatePayment?.(purchase)}
                >
                  <CreditCard className="mr-2 h-3 w-3" />
                  Payment
                </Button>
                {canReceiveStock(purchase) ? (
                  <Button
                    variant="outline"
                    className="h-8 border-stone-200 px-3 text-xs text-stone-700 hover:bg-stone-100"
                    onClick={() => onReceiveStock?.(purchase)}
                  >
                    <ArrowDownToLine className="mr-2 h-3 w-3" />
                    Receive
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
