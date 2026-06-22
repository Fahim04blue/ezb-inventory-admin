"use client";

import { PaymentStatus } from "@/lib/domain-enums";
import { useEffect, useState } from "react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatEnum } from "@/lib/formatters";
import type { PurchaseView } from "../types/purchase.types";

type PurchasePaymentDrawerProps = {
  purchase: PurchaseView | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (purchase: PurchaseView, paymentStatus: PaymentStatus) => Promise<void>;
};

export function PurchasePaymentDrawer({
  purchase,
  isSubmitting,
  onClose,
  onSubmit,
}: PurchasePaymentDrawerProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.UNPAID);

  useEffect(() => {
    if (purchase) {
      setPaymentStatus(purchase.paymentStatus);
    }
  }, [purchase]);

  return (
    <CrudDrawer
      description="Supplier payment status tracks whether this purchase batch has been paid to the supplier, shop, or source."
      onClose={onClose}
      open={Boolean(purchase)}
      title="Update Supplier Payment"
    >
      {purchase ? (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(purchase, paymentStatus);
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
            <div className="mt-2 flex justify-between gap-3">
              <span className="text-stone-500">Total Landed</span>
              <span className="font-semibold text-stone-950">
                {formatCurrency(purchase.totalLandedCostBdt)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Supplier Payment Status</Label>
            <Select
              value={paymentStatus}
              onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PaymentStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatEnum(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
            This updates supplier payment only. It does not change stock, purchase landed
            cost, or order/customer payments.
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
              disabled={isSubmitting}
              type="submit"
            >
              Update Payment
            </Button>
          </div>
        </form>
      ) : null}
    </CrudDrawer>
  );
}
