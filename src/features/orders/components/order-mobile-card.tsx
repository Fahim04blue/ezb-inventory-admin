"use client";

import { useState } from "react";
import { OrderStatus, OrderType } from "@prisma/client";
import { CheckCircle2, Eye, MoreHorizontal, Package, PackageCheck, Pencil, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { OrdersMainTab, OrderView } from "../types/order.types";

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
  if (["CANCELLED", "RETURNED", "REFUNDED"].includes(value)) return "border-rose-200 bg-rose-50 text-rose-700";
  if (["PRE_ORDER", "PRE_ORDERED", "UNPAID"].includes(value)) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-violet-200 bg-violet-50 text-violet-700";
}

function readinessLabel(currentStock: number, quantity: number) {
  if (currentStock >= quantity) return "Ready";
  if (currentStock > 0) return "Partial";
  return "Waiting";
}

function MobileOrderActions(props: Props) {
  const { order, isMutating, onView, onEdit, onDeliver, onCancel, onFulfill, view } = props;
  const [open, setOpen] = useState(false);
  const canDeliver =
    view === "ACTIVE" &&
    order.orderType === OrderType.NORMAL &&
    order.status !== OrderStatus.DELIVERED &&
    order.status !== OrderStatus.CANCELLED;
  const canFulfill =
    view === "PRE_ORDERS" &&
    order.orderType === OrderType.PRE_ORDER &&
    order.status !== OrderStatus.DELIVERED &&
    order.status !== OrderStatus.CANCELLED &&
    order.status !== OrderStatus.RETURNED;
  const canEdit = !(order.orderType === OrderType.PRE_ORDER && order.status === OrderStatus.DELIVERED);

  function run(action: (order: OrderView) => void) {
    setOpen(false);
    action(order);
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild><Button aria-label="Order actions" className="h-8 w-8 rounded-xl px-0" variant="outline"><MoreHorizontal className="h-4 w-4" /></Button></PopoverTrigger>
      <PopoverContent align="end" className="z-[70] w-48 rounded-xl bg-white p-1 shadow-xl">
        <Button className="h-9 w-full justify-start border-0 bg-transparent px-2 text-slate-800 shadow-none" onClick={() => run(onView)} variant="outline"><Eye className="mr-2 h-4 w-4" />View</Button>
        {canEdit ? <Button className="h-9 w-full justify-start border-0 bg-transparent px-2 text-slate-800 shadow-none" disabled={isMutating} onClick={() => run(onEdit)} variant="outline"><Pencil className="mr-2 h-4 w-4" />Edit</Button> : null}
        {canDeliver ? <Button className="h-9 w-full justify-start border-0 bg-transparent px-2 text-slate-800 shadow-none" disabled={isMutating} onClick={() => run(onDeliver)} variant="outline"><CheckCircle2 className="mr-2 h-4 w-4" />Mark Delivered</Button> : null}
        {canFulfill ? <Button className="h-9 w-full justify-start border-0 bg-transparent px-2 text-slate-800 shadow-none" disabled={isMutating} onClick={() => run(onFulfill)} variant="outline"><PackageCheck className="mr-2 h-4 w-4" />{order.status === OrderStatus.READY_TO_DELIVER ? "Complete delivery" : "Fulfill"}</Button> : null}
        {view !== "COMPLETED" && order.status !== OrderStatus.CANCELLED ? <Button className="h-9 w-full justify-start border-0 bg-transparent px-2 text-rose-700 shadow-none" disabled={isMutating} onClick={() => run(onCancel)} variant="outline"><XCircle className="mr-2 h-4 w-4" />Cancel</Button> : null}
      </PopoverContent>
    </Popover>
  );
}

export function OrderMobileCard(props: Props) {
  const { order, onView } = props;
  const visibleItems = order.items.slice(0, 2);
  const readyItemCount = order.items.filter(
    (item) => item.currentStock >= item.quantity,
  ).length;
  const orderReadiness =
    readyItemCount === order.items.length
      ? "Ready"
      : readyItemCount > 0 || order.items.some((item) => item.currentStock > 0)
        ? "Partial"
        : "Waiting";
  const stats = [
    { label: order.orderType === OrderType.PRE_ORDER && props.view === "PRE_ORDERS" ? "Due" : "Payable", value: formatCurrency(order.orderType === OrderType.PRE_ORDER && props.view === "PRE_ORDERS" ? order.dueAmount : order.customerPayable), className: Number(order.dueAmount) > 0 && props.view === "PRE_ORDERS" ? "text-rose-700" : "text-slate-950" },
    { label: order.orderType === OrderType.PRE_ORDER && props.view === "PRE_ORDERS" ? "Advance" : "Received", value: formatCurrency(order.amountReceived), className: "text-slate-950" },
    { label: "Payment", value: formatEnum(order.paymentStatus), className: order.paymentStatus === "PAID" ? "text-emerald-700" : "text-slate-950" },
    { label: "Status", value: formatEnum(order.status), className: "text-slate-950" },
    { label: props.view === "PRE_ORDERS" ? "Expected Profit" : props.view === "COMPLETED" ? "Final Profit" : "Profit", value: formatCurrency(order.netProfit), className: Number(order.netProfit) < 0 ? "text-rose-700" : "text-emerald-700" },
  ];

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <button className="min-w-0 text-left" onClick={() => onView(order)} type="button"><span className="block truncate text-sm font-semibold text-slate-950">{order.orderNumber}</span><span className="mt-1 block truncate text-xs text-slate-500">{order.customerName || "Walk-in customer"}{order.customerPhone ? ` · ${order.customerPhone}` : ""}</span></button>
          <div className="flex shrink-0 items-center gap-1.5"><span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", badgeTone(order.orderType))}>{formatEnum(order.orderType)}</span>{order.orderType === OrderType.PRE_ORDER ? <span className={cn("rounded-full px-2 py-0.5 text-[9px]", orderReadiness === "Ready" ? "bg-emerald-50 text-emerald-700" : orderReadiness === "Partial" ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700")}>{orderReadiness}</span> : null}<MobileOrderActions {...props} /></div>
        </div>

        <div className="mt-3 space-y-1.5">
          {visibleItems.map((item) => (
            <div className="flex items-center gap-2 text-xs" key={item.id}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Package className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-slate-800">{item.productName} {item.variantName} <span className="text-slate-500">×{item.quantity}</span></span>{order.orderType === OrderType.PRE_ORDER ? <span className="text-[9px] text-slate-500">{item.purchaseItemId ? "Incoming" : "Stock"}</span> : null}</span>{order.orderType === OrderType.PRE_ORDER ? <span className={cn("rounded-full px-2 py-0.5 text-[9px]", readinessLabel(item.currentStock, item.quantity) === "Ready" ? "bg-emerald-50 text-emerald-700" : readinessLabel(item.currentStock, item.quantity) === "Partial" ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700")}>{readinessLabel(item.currentStock, item.quantity)}</span> : null}</div>
          ))}
          {order.items.length > 2 ? <p className="pl-9 text-[10px] text-slate-500">+{order.items.length - 2} more items</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-5 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/40 px-1 py-2.5">
        {stats.map((stat) => <div className="min-w-0 px-1 text-center" key={stat.label}><p className="text-[9px] text-slate-500">{stat.label}</p><p className={cn("mt-1 truncate text-[9px] font-semibold min-[410px]:text-[10px]", stat.className)}>{stat.value}</p>{stat.label === "Received" && Number(order.dueAmount) > 0 ? <p className="truncate text-[8px] text-rose-600">Due {formatCurrency(order.dueAmount)}</p> : null}</div>)}
      </div>
    </article>
  );
}
