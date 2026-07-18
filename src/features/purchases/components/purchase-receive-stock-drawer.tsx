"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";
import type { PurchaseView } from "../types/purchase.types";

type ReceiveLine = {
  purchaseItemId: number;
  receiveQuantity: number;
};

type ReceiveLineInput = {
  purchaseItemId: number;
  receiveQuantity: string;
};

type PurchaseReceiveStockDrawerProps = {
  purchase: PurchaseView | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (purchase: PurchaseView, items: ReceiveLine[]) => Promise<void>;
};

export function PurchaseReceiveStockDrawer({
  purchase,
  isSubmitting,
  onClose,
  onSubmit,
}: PurchaseReceiveStockDrawerProps) {
  const [lines, setLines] = useState<ReceiveLineInput[]>([]);

  useEffect(() => {
    if (purchase) {
      setLines(
        purchase.items.map((item) => ({
          purchaseItemId: item.id,
          receiveQuantity: "",
        })),
      );
    }
  }, [purchase]);

  function getReceiveQuantity(value: string | undefined) {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  const totalReceiveQuantity = useMemo(
    () => lines.reduce((sum, line) => sum + getReceiveQuantity(line.receiveQuantity), 0),
    [lines],
  );

  function setReceiveQuantity(purchaseItemId: number, receiveQuantity: string) {
    setLines((prev) =>
      prev.map((line) =>
        line.purchaseItemId === purchaseItemId ? { ...line, receiveQuantity } : line,
      ),
    );
  }

  return (
    <CrudDrawer
      description="Receive physical stock for this purchase. Reserved pre-orders stay reserved and are not auto-fulfilled."
      onClose={onClose}
      open={Boolean(purchase)}
      title="Receive Stock"
    >
      {purchase ? (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            const receiveItems = lines.map((line) => ({
              purchaseItemId: line.purchaseItemId,
              receiveQuantity: getReceiveQuantity(line.receiveQuantity),
            }));

            void onSubmit(purchase, receiveItems);
          }}
        >
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-stone-500">Purchase</span>
              <span className="font-semibold text-stone-950">{purchase.referenceNumber}</span>
            </div>
            <div className="mt-2 flex justify-between gap-3">
              <span className="text-stone-500">Supplier</span>
              <span className="font-medium text-stone-900">
                {purchase.supplier?.name ?? "Unknown"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {purchase.items.map((item) => {
              const remainingQuantity = item.quantity - item.receivedQuantity;
              const line = lines.find((entry) => entry.purchaseItemId === item.id);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-950">
                        {item.productVariant.product.name} - {item.productVariant.name}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        SKU {item.productVariant.sku || "-"}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-stone-900">
                      {formatCurrency(item.finalUnitLandedCostBdt)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-5">
                    <div>
                      <p className="text-xs text-stone-500">Purchased</p>
                      <p className="font-semibold text-stone-950">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Received</p>
                      <p className="font-semibold text-stone-950">{item.receivedQuantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Reserved Pre-orders</p>
                      <p className="font-semibold text-stone-950">
                        {item.reservedPreOrderQuantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Remaining</p>
                      <p className="font-semibold text-emerald-700">{remainingQuantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Receive Now</p>
                      <Input
                        disabled={isSubmitting}
                        className="mt-1 h-9 rounded-xl"
                        max={remainingQuantity}
                        min={0}
                        onChange={(event) => setReceiveQuantity(item.id, event.target.value)}
                        placeholder="0"
                        step={1}
                        type="number"
                        value={line?.receiveQuantity ?? ""}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
            Receiving stock only increases physical stock and creates purchase receive
            movements. Pre-orders are fulfilled from the Orders page.
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-stone-200 pt-4 sm:flex-row sm:justify-end">
            <Button
              className="w-auto rounded-xl px-4"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="w-auto rounded-xl bg-emerald-800 px-4 text-white hover:bg-emerald-900"
              disabled={isSubmitting || totalReceiveQuantity <= 0}
              type="submit"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Receiving stock…" : "Receive Stock"}
            </Button>
          </div>
        </form>
      ) : null}
    </CrudDrawer>
  );
}
