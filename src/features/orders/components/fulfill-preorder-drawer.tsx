"use client";

import { OrderStatus, PaymentStatus } from "@prisma/client";
import { useMemo, useState } from "react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatEnum } from "@/lib/formatters";
import type { FulfillPreOrderInput } from "../schemas/order.schema";
import type { OrderView } from "../types/order.types";

type FulfillPreOrderDrawerProps = {
  order: OrderView | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (order: OrderView, input: FulfillPreOrderInput) => Promise<void>;
};

function toNumber(value: string) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyInputValue(value: string | number | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? String(parsed) : "0";
}

function hasEnoughStock(order: OrderView) {
  // READY_TO_DELIVER pre-orders already had stock deducted during fulfillment.
  return (
    order.status === OrderStatus.READY_TO_DELIVER ||
    order.items.every((item) => item.currentStock >= item.quantity)
  );
}

export function FulfillPreOrderDrawer({
  order,
  isSubmitting,
  onClose,
  onSubmit,
}: FulfillPreOrderDrawerProps) {
  const [customerName, setCustomerName] = useState(order?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(order?.customerPhone ?? "");
  const [customerAddress, setCustomerAddress] = useState(order?.customerAddress ?? "");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    order?.paymentStatus ?? PaymentStatus.UNPAID,
  );
  const [discountAmount, setDiscountAmount] = useState(
    moneyInputValue(order?.discountAmount),
  );
  const [deliveryCharge, setDeliveryCharge] = useState(
    moneyInputValue(order?.deliveryCharge),
  );
  const [courierDeduction, setCourierDeduction] = useState(
    moneyInputValue(order?.courierDeduction),
  );
  const [amountReceived, setAmountReceived] = useState(
    moneyInputValue(order?.amountReceived),
  );
  const [isAmountReceivedManual, setIsAmountReceivedManual] = useState(false);
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [finalStatus, setFinalStatus] = useState<FulfillPreOrderInput["finalStatus"]>(
    OrderStatus.DELIVERED,
  );

  const totals = useMemo(() => {
    const subtotal =
      order?.items.reduce((sum, item) => sum + Number(item.totalSellingPrice), 0) ?? 0;
    const productCost =
      order?.items.reduce((sum, item) => sum + Number(item.totalCost), 0) ?? 0;
    const discount = toNumber(discountAmount);
    const delivery = toNumber(deliveryCharge);
    const courier = toNumber(courierDeduction);
    const customerPayable = subtotal - discount;
    const automaticAmountReceived = customerPayable + delivery - courier;
    const received = isAmountReceivedManual
      ? toNumber(amountReceived)
      : automaticAmountReceived;

    return {
      subtotal,
      productCost,
      discount,
      delivery,
      courier,
      customerPayable,
      automaticAmountReceived,
      received,
      expectedProfit: customerPayable - productCost,
      netProfit: received - productCost,
    };
  }, [
    amountReceived,
    courierDeduction,
    deliveryCharge,
    discountAmount,
    isAmountReceivedManual,
    order,
  ]);

  if (!order) {
    return null;
  }

  const stockReady = hasEnoughStock(order);
  const amountReceivedValue = isAmountReceivedManual
    ? amountReceived
    : String(Math.max(0, totals.automaticAmountReceived));
  const isInvalid =
    !stockReady ||
    totals.customerPayable < 0 ||
    totals.courier > totals.customerPayable + totals.delivery ||
    totals.received < 0;
  const isCompletingDelivery = order.status === OrderStatus.READY_TO_DELIVER;

  return (
    <CrudDrawer
      description={
        isCompletingDelivery
          ? "Update final delivery, payment, and settlement details. Stock was already deducted."
          : "Review final delivery, payment, and settlement details before stock is deducted."
      }
      onClose={onClose}
      open={Boolean(order)}
      title={isCompletingDelivery ? "Complete Pre-order Delivery" : "Fulfill Pre-order"}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();

          void onSubmit(order, {
            customerName,
            customerPhone,
            customerAddress,
            paymentStatus,
            discountAmount: totals.discount,
            deliveryCharge: totals.delivery,
            courierDeduction: totals.courier,
            amountReceived: totals.received,
            notes,
            finalStatus,
          });
        }}
      >
        {!stockReady ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Stock not received yet.
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">{order.orderNumber}</p>
              <p className="text-xs text-slate-500">
                {order.items.length} item{order.items.length === 1 ? "" : "s"}
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-950">
              {formatCurrency(totals.subtotal)}
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {order.items.map((item) => (
              <div
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs"
                key={item.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {item.productName} {item.variantName}
                  </p>
                  <p className="text-slate-500">
                    Qty {item.quantity} / Stock {item.currentStock}
                  </p>
                </div>
                <span className="font-medium text-slate-900">
                  {formatCurrency(item.totalSellingPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Final status</Label>
            <Select
              value={finalStatus}
              onValueChange={(value) =>
                setFinalStatus(value as FulfillPreOrderInput["finalStatus"])
              }
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OrderStatus.READY_TO_DELIVER}>
                  {formatEnum(OrderStatus.READY_TO_DELIVER)}
                </SelectItem>
                <SelectItem value={OrderStatus.DELIVERED}>
                  {formatEnum(OrderStatus.DELIVERED)}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Payment</Label>
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
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Customer name</Label>
            <Input
              className="h-10 rounded-xl"
              onChange={(event) => setCustomerName(event.target.value)}
              value={customerName}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              className="h-10 rounded-xl"
              onChange={(event) => setCustomerPhone(event.target.value)}
              value={customerPhone}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input
              className="h-10 rounded-xl"
              onChange={(event) => setCustomerAddress(event.target.value)}
              value={customerAddress}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Discount</Label>
            <Input
              className="h-10 rounded-xl"
              min={0}
              onChange={(event) => setDiscountAmount(event.target.value)}
              step="0.01"
              type="number"
              value={discountAmount}
            />
            {totals.customerPayable < 0 ? (
              <p className="text-xs text-rose-600">
                Discount cannot be greater than product subtotal.
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label>Delivery Charge</Label>
            <Input
              className="h-10 rounded-xl"
              min={0}
              onChange={(event) => setDeliveryCharge(event.target.value)}
              step="0.01"
              type="number"
              value={deliveryCharge}
            />
          </div>
          <div className="space-y-1.5">
            <Label>COD/Courier Fee</Label>
            <p className="text-xs text-slate-500">
              Deducted by courier company before settlement.
            </p>
            <Input
              className="h-10 rounded-xl"
              min={0}
              onChange={(event) => setCourierDeduction(event.target.value)}
              step="0.01"
              type="number"
              value={courierDeduction}
            />
            {totals.courier > totals.customerPayable + totals.delivery ? (
              <p className="text-xs text-rose-600">
                COD/courier fee cannot exceed customer payable plus delivery.
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label>Amount Received</Label>
            <p className="text-xs text-slate-500">
              {isAmountReceivedManual
                ? "Actual received override."
                : "Auto: customer payable plus delivery minus COD/courier fee."}
            </p>
            <Input
              className="h-10 rounded-xl"
              min={0}
              onChange={(event) => {
                setIsAmountReceivedManual(true);
                setAmountReceived(event.target.value);
              }}
              step="0.01"
              type="number"
              value={amountReceivedValue}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
          <div className="flex justify-between gap-3 text-slate-600">
            <span>Product Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-slate-600">
            <span>Discount</span>
            <span>{formatCurrency(totals.discount)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 font-semibold text-slate-950">
            <span>Customer Payable</span>
            <span>{formatCurrency(totals.customerPayable)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-slate-600">
            <span>Delivery Charge</span>
            <span>{formatCurrency(totals.delivery)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-slate-600">
            <span>COD/Courier Fee</span>
            <span>{formatCurrency(totals.courier)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-slate-600">
            <span>Amount Received</span>
            <span>{formatCurrency(totals.received)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-slate-600">
            <span>Product Cost</span>
            <span>{formatCurrency(totals.productCost)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-slate-600">
            <span>Expected Profit</span>
            <span>{formatCurrency(totals.expectedProfit)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 border-t border-slate-200 pt-2 font-semibold">
            <span>Net Profit</span>
            <span className={totals.netProfit < 0 ? "text-rose-600" : "text-emerald-700"}>
              {formatCurrency(totals.netProfit)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea
            className="min-h-20 rounded-xl"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional internal notes"
            value={notes}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
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
            disabled={isSubmitting || isInvalid}
            type="submit"
          >
            {isCompletingDelivery ? "Complete Delivery" : "Fulfill Pre-order"}
          </Button>
        </div>
      </form>
    </CrudDrawer>
  );
}
