"use client";

import { useState } from "react";
import { OrderStatus, OrderType } from "@/lib/domain-enums";
import { CheckCircle2, Eye, MoreHorizontal, Package, PackageCheck, Pencil, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { OrdersMainTab, OrderView } from "../types/order.types";
import {
  getPreOrderActionLabel,
  getPreOrderItemState,
  getPreOrderItemStateCounts,
} from "../utils/order-tab-logic";

type Props = {
  order: OrderView;
  view: OrdersMainTab;
  isMutating: boolean;
  onView: (order: OrderView) => void;
  onEdit: (order: OrderView) => void;
  onDeliver: (order: OrderView) => void;
  onCancel: (order: OrderView) => void;
  onFulfill: (order: OrderView) => void;
};

function badgeTone(value: string) {
  if (["DELIVERED", "PAID", "NORMAL", "READY_TO_DELIVER"].includes(value)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "PARTIALLY_DELIVERED") return "border-blue-200 bg-blue-50 text-blue-700";
  if (["CANCELLED", "RETURNED", "REFUNDED"].includes(value)) return "border-rose-200 bg-rose-50 text-rose-700";
  if (["PRE_ORDER", "PRE_ORDERED", "UNPAID"].includes(value)) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-violet-200 bg-violet-50 text-violet-700";
}

function readinessLabel(item: OrderView["items"][number]) {
  const state = getPreOrderItemState(item);
  if (state === "MOVED_TO_ORDER") return "Moved";
  if (state === "READY") return "Ready";
  return "Waiting";
}

function readinessClass(label: string) {
  if (label === "Ready") return "bg-emerald-50 text-emerald-700";
  if (label === "Moved") return "bg-slate-50 text-slate-600";
  if (label === "Partially Ready") return "bg-sky-50 text-sky-700";
  return "bg-amber-50 text-amber-700";
}

function PreOrderStateSummary({ order }: { order: OrderView }) {
  const counts = getPreOrderItemStateCounts(order);
  const states = [
    { label: "Ready", count: counts.READY },
    { label: "Waiting", count: counts.WAITING },
    { label: "Moved", count: counts.MOVED_TO_ORDER },
  ] as const;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {states.filter((state) => state.count > 0).map((state) => (
        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium", readinessClass(state.label))} key={state.label}>
          {state.count} {state.label}
        </span>
      ))}
    </div>
  );
}

function MobileOrderActions(props: Props) {
  const { order, isMutating, onView, onEdit, onDeliver, onCancel, onFulfill, view } = props;
  const [open, setOpen] = useState(false);
  const canDeliver = view === "ACTIVE" && order.orderType === OrderType.NORMAL && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED;
  const canFulfill = (view === "ACTIVE" || view === "PRE_ORDERS") && order.orderType === OrderType.PRE_ORDER && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.RETURNED;
  const preOrderCounts = getPreOrderItemStateCounts(order);
  const isWaitingOnlyPreOrder = order.orderType === OrderType.PRE_ORDER && preOrderCounts.WAITING > 0 && preOrderCounts.READY === 0;
  const fulfillLabel = isWaitingOnlyPreOrder ? "Waiting for Remaining Items" : getPreOrderActionLabel(order);
  const canEdit = !(order.orderType === OrderType.PRE_ORDER && order.status === OrderStatus.DELIVERED);

  function run(action: (order: OrderView) => void) {
    setOpen(false);
    action(order);
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button aria-label="Order actions" className="h-8 w-8 rounded-xl px-0" variant="outline"><MoreHorizontal className="h-4 w-4" /></Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[70] w-48 rounded-xl bg-white p-1 shadow-xl">
        <Button className="h-9 w-full justify-start border-0 bg-transparent px-2 text-slate-800 shadow-none" onClick={() => run(onView)} variant="outline"><Eye className="mr-2 h-4 w-4" />View</Button>
        {canEdit ? <Button className="h-9 w-full justify-start border-0 bg-transparent px-2 text-slate-800 shadow-none" disabled={isMutating} onClick={() => run(onEdit)} variant="outline"><Pencil className="mr-2 h-4 w-4" />Edit</Button> : null}
        {canDeliver ? <Button className="h-9 w-full justify-start border-0 bg-transparent px-2 text-slate-800 shadow-none" disabled={isMutating} onClick={() => run(onDeliver)} variant="outline"><CheckCircle2 className="mr-2 h-4 w-4" />Mark Delivered</Button> : null}
        {canFulfill ? <Button className="h-9 w-full justify-start border-0 bg-transparent px-2 text-slate-800 shadow-none" disabled={isMutating || (view === "PRE_ORDERS" && preOrderCounts.READY === 0)} onClick={() => run(onFulfill)} variant="outline"><PackageCheck className="mr-2 h-4 w-4" />{fulfillLabel}</Button> : null}
        {view !== "COMPLETED" && order.status !== OrderStatus.CANCELLED ? <Button className="h-9 w-full justify-start border-0 bg-transparent px-2 text-rose-700 shadow-none" disabled={isMutating} onClick={() => run(onCancel)} variant="outline"><XCircle className="mr-2 h-4 w-4" />Cancel</Button> : null}
      </PopoverContent>
    </Popover>
  );
}

export function OrderMobileCard(props: Props) {
  const { order, onView } = props;
  const showPreOrderLifecycle = order.orderType === OrderType.PRE_ORDER && props.view === "PRE_ORDERS";
  const activeItems = showPreOrderLifecycle
    ? order.items.filter((item) => getPreOrderItemState(item) !== "MOVED_TO_ORDER")
    : order.items;
  const visibleItems = activeItems.slice(0, 2);
  const preOrderCounts = getPreOrderItemStateCounts(order);
  const activeCount = preOrderCounts.WAITING + preOrderCounts.READY;
  const orderReadiness = preOrderCounts.READY === activeCount && activeCount > 0
    ? "Ready"
    : preOrderCounts.READY > 0
      ? "Partially Ready"
      : "Waiting";
  const stats = [
    { label: order.orderType === OrderType.PRE_ORDER && props.view === "PRE_ORDERS" ? "Remaining Due" : "Payable", value: formatCurrency(order.orderType === OrderType.PRE_ORDER && props.view === "PRE_ORDERS" ? order.preOrderRemainingDue : order.customerPayable), className: Number(order.preOrderRemainingDue) > 0 && props.view === "PRE_ORDERS" ? "text-rose-700" : "text-slate-950" },
    { label: order.orderType === OrderType.PRE_ORDER && props.view === "PRE_ORDERS" ? "Collected" : "Received", value: formatCurrency(order.orderType === OrderType.PRE_ORDER && props.view === "PRE_ORDERS" ? order.preOrderCollectedAmount : order.amountReceived), className: "text-slate-950" },
    { label: "Payment", value: formatEnum(order.paymentStatus), className: order.paymentStatus === "PAID" ? "text-emerald-700" : "text-slate-950" },
    { label: "Status", value: formatEnum(order.status), className: "text-slate-950" },
    { label: props.view === "PRE_ORDERS" ? "Expected" : props.view === "COMPLETED" ? "Final Profit" : "Profit", value: formatCurrency(props.view === "PRE_ORDERS" ? order.preOrderRemainingExpectedProfit : order.netProfit), className: Number(props.view === "PRE_ORDERS" ? order.preOrderRemainingExpectedProfit : order.netProfit) < 0 ? "text-rose-700" : "text-emerald-700" },
  ];

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <button className="min-w-0 text-left" onClick={() => onView(order)} type="button">
            <span className="block truncate text-sm font-semibold text-slate-950">{order.orderNumber}</span>
            <span className="mt-1 block truncate text-xs text-slate-500">{order.customerName || "Walk-in customer"}{order.customerPhone ? " / " + order.customerPhone : ""}</span>
          </button>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", badgeTone(order.orderType))}>{formatEnum(order.orderType)}</span>
            {order.orderType === OrderType.NORMAL && order.sourcePreOrderNumber ? <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] text-amber-700">From Pre-order</span> : null}
            {showPreOrderLifecycle ? <span className={cn("rounded-full px-2 py-0.5 text-[9px]", readinessClass(orderReadiness))}>{orderReadiness}</span> : null}
            <MobileOrderActions {...props} />
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {visibleItems.map((item) => (
            <div className="flex items-center gap-2 text-xs" key={item.id}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Package className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-slate-800">{item.productName} {item.variantName} <span className="text-slate-500">x{item.quantity}</span></span>
                {showPreOrderLifecycle ? <span className="text-[9px] text-slate-500">{item.purchaseItemId ? "Incoming" : "Stock"}</span> : null}
              </span>
              {showPreOrderLifecycle ? <span className={cn("rounded-full px-2 py-0.5 text-[9px]", readinessClass(readinessLabel(item)))}>{readinessLabel(item)}</span> : null}
            </div>
          ))}
          {activeItems.length > 2 ? <p className="pl-9 text-[10px] text-slate-500">+{activeItems.length - 2} more items</p> : null}
          {showPreOrderLifecycle && order.preOrderMovedItemSummary ? <p className="pl-9 text-[10px] text-slate-500">Moved: {order.preOrderMovedItemSummary}</p> : null}
          {showPreOrderLifecycle ? <PreOrderStateSummary order={order} /> : null}
        </div>
      </div>

      <div className="grid grid-cols-5 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/40 px-1 py-2.5">
        {stats.map((stat) => <div className="min-w-0 px-1 text-center" key={stat.label}><p className="text-[9px] text-slate-500">{stat.label}</p><p className={cn("mt-1 truncate text-[9px] font-semibold min-[410px]:text-[10px]", stat.className)}>{stat.value}</p>{stat.label === "Received" && Number(order.dueAmount) > 0 ? <p className="truncate text-[8px] text-rose-600">Due {formatCurrency(order.dueAmount)}</p> : null}</div>)}
      </div>
    </article>
  );
}
