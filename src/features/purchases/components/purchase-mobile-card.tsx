"use client";

import { ChevronRight, PackageCheck, PackageOpen, ShoppingBag } from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { PaymentStatusBadge } from "./payment-status-badge";
import { PurchaseStatusBadge } from "./purchase-status-badge";
import { type PurchaseView } from "../types/purchase.types";

const iconStyles = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-violet-100 text-violet-800",
] as const;

function getTotalQuantity(purchase: PurchaseView) {
  return purchase.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function PurchaseMobileCard({
  index,
  onOpen,
  purchase,
}: {
  index: number;
  onOpen: (purchase: PurchaseView) => void;
  purchase: PurchaseView;
}) {
  const totalQty = getTotalQuantity(purchase);
  const previewItems = purchase.items.slice(0, 2);
  const extraCount = purchase.items.length - previewItems.length;
  const Icon = index % 2 === 0 ? ShoppingBag : index % 3 === 0 ? PackageOpen : PackageCheck;

  return (
    <button
      className="w-full overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-3.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-transform active:scale-[0.995]"
      onClick={() => onOpen(purchase)}
      type="button"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]",
            iconStyles[index % iconStyles.length],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="line-clamp-2 text-base font-semibold tracking-tight text-stone-950">
                {purchase.supplier?.name || "Unknown Supplier"}
              </p>
              <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">
                {purchase.referenceNumber}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <PurchaseStatusBadge status={purchase.status} />
              <PaymentStatusBadge status={purchase.paymentStatus} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {previewItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex max-w-[8.75rem] items-center rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-medium text-stone-800"
              >
                <span className="truncate">
                  {item.productVariant.product.name} ×{item.quantity}
                </span>
              </span>
            ))}
            {extraCount > 0 ? (
              <span className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-700">
                +{extraCount} more
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,.8fr)_minmax(0,1fr)_auto] items-end gap-2 border-t border-stone-200 pt-4">
        <div className="min-w-0">
          <p className="text-[9px] text-stone-500">Total Landed</p>
          <p className="mt-1 truncate text-[0.95rem] font-semibold text-emerald-800">
            {formatCurrency(Number(purchase.totalLandedCostBdt))}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[9px] text-stone-500">Total Qty</p>
          <p className="mt-1 text-[0.95rem] font-semibold text-stone-950">
            {totalQty} pcs
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[9px] text-stone-500">Date</p>
          <p className="mt-1 text-[0.95rem] font-semibold text-stone-950">
            {formatDate(purchase.purchaseDate)}
          </p>
        </div>
        <ChevronRight className="mb-1 h-4 w-4 shrink-0 text-stone-500" />
      </div>
    </button>
  );
}
