"use client";

import {
  CheckCircle2,
  Eye,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  XCircle,
} from "lucide-react";
import { OrderStatus, OrderType } from "@prisma/client";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { OrdersMainTab, OrderItemView, OrderView } from "../types/order.types";

type OrdersTableProps = {
  orders: OrderView[];
  view: OrdersMainTab;
  onViewOrder: (order: OrderView) => void;
  onEditOrder: (order: OrderView) => void;
  onMarkDelivered: (order: OrderView) => void;
  onCancelOrder: (order: OrderView) => void;
  onFulfillPreOrder: (order: OrderView) => void;
  isMutating: boolean;
};

function orderTypeBadgeClass(value: OrderType) {
  if (value === OrderType.NORMAL) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function statusBadgeClass(value: OrderStatus) {
  if (value === OrderStatus.DELIVERED) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === OrderStatus.CONFIRMED) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (value === OrderStatus.PENDING) {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  if (value === OrderStatus.PRE_ORDERED) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (value === OrderStatus.READY_TO_DELIVER) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (value === OrderStatus.CANCELLED || value === OrderStatus.RETURNED) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function sourceBadgeClass(value: string) {
  if (value === "FACEBOOK") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (value === "INSTAGRAM") {
    return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
  }

  if (value === "WHATSAPP") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-white text-slate-600";
}

function customerLabel(order: OrderView) {
  if (order.customerName || order.customerPhone) {
    return [order.customerName, order.customerPhone].filter(Boolean).join(" / ");
  }

  return "Walk-in / Unknown";
}

function profitClass(value: string) {
  return Number(value) < 0 ? "text-rose-600" : "text-emerald-700";
}

function itemLabel(item: OrderItemView) {
  return `${item.productName} ${item.variantName}`.trim();
}

function itemReadiness(item: OrderItemView) {
  if (item.currentStock >= item.quantity) {
    return {
      label: "Ready",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (item.currentStock > 0) {
    return {
      label: "Partial",
      className: "border-violet-200 bg-violet-50 text-violet-700",
    };
  }

  return {
    label: "Waiting",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  };
}

function orderReadiness(order: OrderView) {
  const readyItems = order.items.filter(
    (item) => item.currentStock >= item.quantity,
  ).length;

  if (readyItems === order.items.length) {
    return { label: "Ready", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }

  if (readyItems > 0 || order.items.some((item) => item.currentStock > 0)) {
    return { label: "Partial", className: "border-violet-200 bg-violet-50 text-violet-700" };
  }

  return { label: "Waiting", className: "border-amber-200 bg-amber-50 text-amber-700" };
}

function OrderItemsSummary({ order }: { order: OrderView }) {
  const visibleItems = order.items.slice(0, 3);
  const hiddenCount = Math.max(0, order.items.length - visibleItems.length);

  return (
    <div className="max-w-[280px] space-y-0.5">
      {visibleItems.map((item) => {
        const readiness = itemReadiness(item);
        const label = itemLabel(item);

        return (
          <div
            className="flex min-w-0 items-baseline gap-1.5 text-xs leading-5"
            key={item.id}
            title={`${label} x${item.quantity}`}
          >
            <span className="truncate font-medium text-slate-900">{label}</span>
            <span className="shrink-0 text-slate-500">x{item.quantity}</span>
            {order.orderType === OrderType.PRE_ORDER ? (
              <Badge
                className={cn(
                  "h-4 shrink-0 border px-1.5 py-0 text-[10px] font-medium leading-none",
                  readiness.className,
                )}
              >
                  {readiness.label}
              </Badge>
            ) : null}
          </div>
        );
      })}
      {hiddenCount > 0 ? (
        <p className="text-xs font-medium leading-5 text-slate-500">+{hiddenCount} more</p>
      ) : null}
    </div>
  );
}

type OrderActionsMenuProps = {
  order: OrderView;
  canCancel: boolean;
  canDeliver: boolean;
  canEdit: boolean;
  canFulfill: boolean;
  fulfillDisabledReason?: string | null;
  isMutating: boolean;
  onViewOrder: (order: OrderView) => void;
  onEditOrder: (order: OrderView) => void;
  onMarkDelivered: (order: OrderView) => void;
  onCancelOrder: (order: OrderView) => void;
  onFulfillPreOrder: (order: OrderView) => void;
};

function OrderActionsMenu({
  order,
  canCancel,
  canDeliver,
  canEdit,
  canFulfill,
  fulfillDisabledReason,
  isMutating,
  onViewOrder,
  onEditOrder,
  onMarkDelivered,
  onCancelOrder,
  onFulfillPreOrder,
}: OrderActionsMenuProps) {
  const [open, setOpen] = useState(false);

  function runAction(action: (order: OrderView) => void) {
    setOpen(false);
    action(order);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Order actions"
          className="h-8 w-8 rounded-xl px-0"
          variant="outline"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-[70] w-48 rounded-xl border-slate-200 bg-white p-1 shadow-xl"
      >
        <div className="space-y-1">
          <Button
            className="h-9 w-full justify-start rounded-lg border-transparent bg-transparent px-2 text-sm shadow-none hover:bg-slate-50"
            onClick={() => runAction(onViewOrder)}
            variant="outline"
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          {canEdit ? (
            <Button
              className="h-9 w-full justify-start rounded-lg border-transparent bg-transparent px-2 text-sm shadow-none hover:bg-slate-50"
              disabled={isMutating}
              onClick={() => runAction(onEditOrder)}
              variant="outline"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : null}
          {canDeliver ? (
            <Button
              className="h-9 w-full justify-start rounded-lg border-transparent bg-transparent px-2 text-sm shadow-none hover:bg-slate-50"
              disabled={isMutating}
              onClick={() => runAction(onMarkDelivered)}
              variant="outline"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Delivered
            </Button>
          ) : null}
          {canFulfill ? (
            <div>
              <Button
                className="h-9 w-full justify-start rounded-lg border-transparent bg-transparent px-2 text-sm shadow-none hover:bg-slate-50"
                disabled={isMutating || Boolean(fulfillDisabledReason)}
                onClick={() => runAction(onFulfillPreOrder)}
                title={fulfillDisabledReason ?? undefined}
                variant="outline"
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                {order.status === OrderStatus.READY_TO_DELIVER
                  ? "Complete delivery"
                  : "Fulfill"}
              </Button>
              {fulfillDisabledReason ? (
                <p className="px-2 pb-1 text-xs text-amber-700">
                  {fulfillDisabledReason}
                </p>
              ) : null}
            </div>
          ) : null}
          {canCancel ? (
            <Button
              className="h-9 w-full justify-start rounded-lg border-transparent bg-transparent px-2 text-sm text-rose-700 shadow-none hover:bg-rose-50 hover:text-rose-700"
              disabled={isMutating}
              onClick={() => runAction(onCancelOrder)}
              variant="outline"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function OrdersTable({
  orders,
  view,
  onViewOrder,
  onEditOrder,
  onMarkDelivered,
  onCancelOrder,
  onFulfillPreOrder,
  isMutating,
}: OrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="max-w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/80">
          <TableRow className="hover:bg-slate-50/80">
            <TableHead className="px-3 text-xs font-semibold text-slate-700">
              Date
            </TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">
              Order
            </TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">
              Customer
            </TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">
              Type
            </TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">
              Items
            </TableHead>
            <TableHead className="text-right text-xs font-semibold text-slate-700">
              {view === "PRE_ORDERS" ? "Due" : "Customer Payable"}
            </TableHead>
            <TableHead className="text-right text-xs font-semibold text-slate-700">
              {view === "PRE_ORDERS" ? "Advance Received" : "Amount Received"}
            </TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">
              Payment
            </TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">
              Status
            </TableHead>
            <TableHead className="text-right text-xs font-semibold text-slate-700">
              {view === "PRE_ORDERS"
                ? "Expected Profit"
                : view === "COMPLETED"
                  ? "Final Profit"
                  : "Profit"}
            </TableHead>
            <TableHead className="text-right text-xs font-semibold text-slate-700">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const readiness = orderReadiness(order);
            const canCancel =
              view !== "COMPLETED" && order.status !== OrderStatus.CANCELLED;
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
            const hasFulfillmentStock = order.items.every(
              (item) => item.currentStock >= item.quantity,
            );
            const fulfillDisabledReason =
              canFulfill && !hasFulfillmentStock ? "Stock not received yet." : null;
            const canEdit = !(
              order.orderType === OrderType.PRE_ORDER &&
              order.status === OrderStatus.DELIVERED
            );

            return (
              <TableRow key={order.id} className="h-11 hover:bg-slate-50/70">
                <TableCell className="px-3 py-1.5 text-sm text-slate-700">
                  {formatDate(order.orderDate)}
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="min-w-[132px]">
                    <p className="font-medium text-slate-950">{order.orderNumber}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge
                        className={cn(
                          "border px-2 py-0 text-[11px]",
                          sourceBadgeClass(order.source),
                        )}
                      >
                        {formatEnum(order.source)}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="max-w-[190px]">
                    <p className="truncate text-sm text-slate-900">
                      {customerLabel(order)}
                    </p>
                    {order.customerAddress ? (
                      <p className="truncate text-xs text-slate-500">
                        {order.customerAddress}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="flex flex-col items-start gap-1">
                    <Badge className={cn("border px-2 py-0 text-[11px]", orderTypeBadgeClass(order.orderType))}>
                      {formatEnum(order.orderType)}
                    </Badge>
                    {order.orderType === OrderType.PRE_ORDER ? (
                      <Badge className={cn("border px-2 py-0 text-[10px]", readiness.className)}>
                        {readiness.label}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <OrderItemsSummary order={order} />
                </TableCell>
                <TableCell className="py-1.5 text-right font-semibold text-slate-950">
                  {formatCurrency(
                    view === "PRE_ORDERS" ? order.dueAmount : order.customerPayable,
                  )}
                </TableCell>
                <TableCell className="py-1.5 text-right font-semibold text-slate-950">
                  {formatCurrency(order.amountReceived)}
                </TableCell>
                <TableCell className="py-1.5">
                  <p className="text-sm font-medium text-slate-800">
                    {formatEnum(order.paymentStatus)}
                  </p>
                  {order.paymentStatus !== "PAID" && Number(order.dueAmount) > 0 ? (
                    <p className="text-xs text-rose-600">
                      Due {formatCurrency(order.dueAmount)}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="py-1.5">
                  <Badge className={cn("border px-2 py-0 text-[11px]", statusBadgeClass(order.status))}>
                    {formatEnum(order.status)}
                  </Badge>
                </TableCell>
                <TableCell
                  className={cn(
                    "py-1.5 text-right font-semibold",
                    profitClass(order.netProfit),
                  )}
                >
                  {formatCurrency(order.netProfit)}
                  {order.orderType === OrderType.PRE_ORDER &&
                  order.status === OrderStatus.PRE_ORDERED ? (
                    <p className="text-xs font-normal text-slate-500">
                      Expected
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="py-1.5 pr-3">
                  <div className="flex justify-end">
                    <OrderActionsMenu
                      canCancel={canCancel}
                      canDeliver={canDeliver}
                      canEdit={canEdit}
                      canFulfill={canFulfill}
                      fulfillDisabledReason={fulfillDisabledReason}
                      isMutating={isMutating}
                      onCancelOrder={onCancelOrder}
                      onEditOrder={onEditOrder}
                      onFulfillPreOrder={onFulfillPreOrder}
                      onMarkDelivered={onMarkDelivered}
                      onViewOrder={onViewOrder}
                      order={order}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
