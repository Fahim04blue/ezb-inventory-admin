"use client";

import { OrderItemFulfillmentStatus, PaymentStatus } from "@/lib/domain-enums";
import { useMemo, useState } from "react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import type { DeliverPreOrderItemsInput } from "../schemas/order.schema";
import type { OrderItemView, OrderView } from "../types/order.types";

type FulfillPreOrderDrawerProps = {
  order: OrderView | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (order: OrderView, input: DeliverPreOrderItemsInput) => Promise<void>;
};

function toNumber(value: string) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyInputValue(value: string | number | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? String(parsed) : "0";
}

function remainingQuantity(item: OrderItemView) {
  return Math.max(0, item.quantity - item.deliveredQuantity);
}

function itemDeliveryStatus(item: OrderItemView) {
  if (
    item.fulfillmentStatus === OrderItemFulfillmentStatus.MOVED_TO_ORDER ||
    item.fulfillmentStatus === OrderItemFulfillmentStatus.IN_DELIVERY ||
    item.fulfillmentStatus === OrderItemFulfillmentStatus.DELIVERED ||
    item.fulfillmentStatus === OrderItemFulfillmentStatus.CANCELLED ||
    item.fulfillmentStatus === OrderItemFulfillmentStatus.RETURNED
  ) {
    return OrderItemFulfillmentStatus.MOVED_TO_ORDER;
  }

  return (item.currentStock ?? 0) >= remainingQuantity(item)
    ? OrderItemFulfillmentStatus.READY
    : OrderItemFulfillmentStatus.WAITING;
}

function fulfillmentBadgeClass(status: OrderItemFulfillmentStatus) {
  if (status === OrderItemFulfillmentStatus.READY) return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === OrderItemFulfillmentStatus.WAITING) return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === OrderItemFulfillmentStatus.MOVED_TO_ORDER) return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-rose-200 bg-rose-50 text-rose-700";
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
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>(() =>
    order?.items
      .filter((item) => itemDeliveryStatus(item) === OrderItemFulfillmentStatus.READY)
      .map((item) => item.id) ?? [],
  );

  const readyItems = useMemo(
    () =>
      order?.items.filter(
        (item) => itemDeliveryStatus(item) === OrderItemFulfillmentStatus.READY,
      ) ?? [],
    [order],
  );
  const waitingItems = useMemo(
    () =>
      order?.items.filter(
        (item) => itemDeliveryStatus(item) === OrderItemFulfillmentStatus.WAITING,
      ) ?? [],
    [order],
  );
  const movedItems = useMemo(
    () =>
      order?.items.filter(
        (item) => itemDeliveryStatus(item) === OrderItemFulfillmentStatus.MOVED_TO_ORDER,
      ) ?? [],
    [order],
  );

  const totals = useMemo(() => {
    const selectedItems =
      order?.items.filter((item) => selectedItemIds.includes(item.id)) ?? [];
    const subtotal = selectedItems.reduce(
      (sum, item) => sum + Number(item.unitSellingPrice) * item.quantity,
      0,
    );
    const productCost = selectedItems.reduce(
      (sum, item) => sum + Number(item.unitCost) * item.quantity,
      0,
    );
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
    selectedItemIds,
  ]);

  if (!order) {
    return null;
  }

  const amountReceivedValue = isAmountReceivedManual
    ? amountReceived
    : String(Math.max(0, totals.automaticAmountReceived));
  const isInvalid =
    selectedItemIds.length === 0 ||
    totals.customerPayable < 0 ||
    totals.courier > totals.customerPayable + totals.delivery ||
    totals.received < 0;

  function toggleSelectedItem(itemId: number) {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  }

  function renderItemRow(item: OrderItemView, selectable: boolean) {
    const status = itemDeliveryStatus(item);
    const label = `${item.productName} ${item.variantName}`.trim();

    return (
      <label
        className={cn(
          "flex gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm",
          selectable ? "cursor-pointer hover:border-slate-300" : "opacity-90",
        )}
        key={item.id}
      >
        {selectable ? (
          <input
            checked={selectedItemIds.includes(item.id)}
            className="mt-1 h-4 w-4 rounded border-slate-300"
            onChange={() => toggleSelectedItem(item.id)}
            type="checkbox"
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-950">{label}</span>
            <Badge className={cn("border px-2 py-0 text-[11px]", fulfillmentBadgeClass(status))}>
              {status === OrderItemFulfillmentStatus.MOVED_TO_ORDER ? "Moved" : formatEnum(status)}
            </Badge>
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            Qty {item.quantity} / Delivered {item.deliveredQuantity} / Stock {item.currentStock}
            {item.sku ? ` / ${item.sku}` : ""}
          </span>
          {status === OrderItemFulfillmentStatus.WAITING ? (
            <span className="mt-1 block text-xs text-amber-700">
              Waiting for stock
            </span>
          ) : null}
          {item.purchaseRef ? (
            <span className="mt-1 block text-xs text-slate-500">
              {item.purchaseRef}
              {item.purchaseSupplierName ? ` / ${item.purchaseSupplierName}` : ""}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-right text-xs">
          <span className="block font-semibold text-slate-950">
            {formatCurrency(Number(item.unitSellingPrice) * item.quantity)}
          </span>
          <span className="block text-slate-500">
            Cost {formatCurrency(Number(item.unitCost) * item.quantity)}
          </span>
          <span
            className={Number(item.profit) < 0 ? "text-rose-600" : "text-emerald-700"}
          >
            Profit {formatCurrency(item.profit)}
          </span>
        </span>
      </label>
    );
  }

  return (
    <CrudDrawer
      description="Select only the ready items the customer wants now. A normal order will be created from them."
      onClose={onClose}
      open={Boolean(order)}
      title="Create Order from Pre-order"
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();

          void onSubmit(order, {
            orderItemIds: selectedItemIds,
            customerName,
            customerPhone,
            customerAddress,
            paymentStatus,
            discountAmount: totals.discount,
            deliveryCharge: totals.delivery,
            courierDeduction: totals.courier,
            amountReceived: totals.received,
            notes,
          });
        }}
      >
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold text-slate-950">{order.orderNumber}</p>
          <p className="mt-1 text-xs text-slate-500">
            {order.customerName || "Unknown customer"}
            {order.customerPhone ? ` / ${order.customerPhone}` : ""}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label>Ready to move into a normal order</Label>
            <span className="text-xs text-slate-500">
              {selectedItemIds.length} selected
            </span>
          </div>
          {readyItems.length ? (
            <div className="space-y-2">
              {readyItems.map((item) => renderItemRow(item, true))}
            </div>
          ) : null}
        </div>

        {waitingItems.length ? (
          <div className="space-y-2">
            <Label>Waiting for stock</Label>
            <div className="space-y-2">
              {waitingItems.map((item) => renderItemRow(item, false))}
            </div>
          </div>
        ) : null}

        {movedItems.length ? (
          <div className="space-y-2">
            <Label>Already moved or closed</Label>
            <div className="space-y-2">
              {movedItems.map((item) => renderItemRow(item, false))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="space-y-1.5">
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
            <Input
              className="h-10 rounded-xl"
              min={0}
              onChange={(event) => setCourierDeduction(event.target.value)}
              step="0.01"
              type="number"
              value={courierDeduction}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Amount Received</Label>
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

        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <div className="flex justify-between gap-3 text-slate-600">
            <span>Product Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 font-semibold text-slate-950">
            <span>Customer Payable</span>
            <span>{formatCurrency(totals.customerPayable)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-slate-600">
            <span>Amount Received</span>
            <span>{formatCurrency(totals.received)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-slate-600">
            <span>Product Cost</span>
            <span>{formatCurrency(totals.productCost)}</span>
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
            Create Normal Order
          </Button>
        </div>
      </form>
    </CrudDrawer>
  );
}
