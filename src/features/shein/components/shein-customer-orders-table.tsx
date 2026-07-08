"use client";

import { useState } from "react";
import { Eye, MapPin, MoreHorizontal, Phone, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SheinCustomerOrderGroup } from "../types/shein.types";
import { SheinSourceBadge } from "./shein-source-badge";

export function SheinCustomerOrdersTable({
  groups,
  onOpen,
  onCreate,
}: {
  groups: SheinCustomerOrderGroup[];
  onOpen: (group: SheinCustomerOrderGroup) => void;
  onCreate: (group: SheinCustomerOrderGroup) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
      <div className="grid min-w-[1040px] grid-cols-[minmax(130px,1.05fr)_minmax(150px,1fr)_130px_100px_minmax(130px,1fr)_105px_115px_120px_70px] gap-3 border-b px-4 py-3 text-xs font-semibold text-slate-600">
        <div>Customer Name</div>
        <div>Address</div>
        <div>Phone</div>
        <div>Ordered Items</div>
        <div>Batch Numbers</div>
        <div>Advance</div>
        <div>Due</div>
        <div>Profit</div>
        <div>Actions</div>
      </div>
      <div className="divide-y">
        {groups.map((group) => (
          <CustomerOrderRow key={group.key} group={group} onCreate={onCreate} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function CustomerOrderRow({
  group,
  onOpen,
  onCreate,
}: {
  group: SheinCustomerOrderGroup;
  onOpen: (group: SheinCustomerOrderGroup) => void;
  onCreate: (group: SheinCustomerOrderGroup) => void;
}) {
  const canCreateOrder = group.items.some((item) => item.status === "RECEIVED" && !item.movedToOrderId);

  return (
    <div
      className={cn(
        "grid min-w-[1040px] grid-cols-[minmax(130px,1.05fr)_minmax(150px,1fr)_130px_100px_minmax(130px,1fr)_105px_115px_120px_70px] items-center gap-3 border-l-4 px-4 py-3 text-sm hover:bg-muted/35",
        canCreateOrder
          ? "border-l-emerald-500 bg-emerald-50/45"
          : "border-l-transparent",
      )}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-semibold text-slate-950">{group.customerName}</p>
          <SheinSourceBadge source={group.customerSource} />
          {canCreateOrder ? (
            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Ready
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className={group.arrivedItems ? "text-emerald-600" : "text-amber-600"}>●</span>
          <span>{group.arrivedItems} arrived</span>
          <span>·</span>
          <span>{group.waitingItems} waiting</span>
          {canCreateOrder ? (
            <>
              <span>·</span>
              <span className="font-medium text-emerald-700">can create order</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex min-w-0 items-start gap-2 text-slate-700">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="line-clamp-2">{group.address || "-"}</span>
      </div>
      <div className="flex min-w-0 items-center gap-2 text-slate-700">
        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{group.phone}</span>
      </div>
      <div>
        <p className="font-semibold text-slate-950">{group.totalItems}</p>
        <p className="text-xs text-muted-foreground">{group.totalItems === 1 ? "1 product" : `${group.totalItems} products`}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {group.batches.length ? group.batches.map((batch, index) => <BatchBadge key={`${group.key}-${batch}-${index}`} index={index} label={batch} />) : <span className="text-muted-foreground">None</span>}
      </div>
      <div className="whitespace-nowrap">{formatCurrency(group.totalAdvance)}</div>
      <div className="whitespace-nowrap">{formatCurrency(group.totalDue)}</div>
      <div className="whitespace-nowrap">
        <p className={Number(group.profitAmount) < 0 ? "font-semibold text-rose-600" : "font-semibold text-emerald-700"}>
          {formatCurrency(group.profitAmount)}
        </p>
        {group.profitKind === "ESTIMATED" ? <p className="text-xs text-muted-foreground">Estimated</p> : null}
      </div>
      <div className="flex justify-end">
        <CustomerOrderActionsMenu canCreateOrder={canCreateOrder} group={group} onCreate={onCreate} onOpen={onOpen} />
      </div>
    </div>
  );
}

function CustomerOrderActionsMenu({
  group,
  canCreateOrder,
  onOpen,
  onCreate,
}: {
  group: SheinCustomerOrderGroup;
  canCreateOrder: boolean;
  onOpen: (group: SheinCustomerOrderGroup) => void;
  onCreate: (group: SheinCustomerOrderGroup) => void;
}) {
  const [open, setOpen] = useState(false);

  function runAction(action: (group: SheinCustomerOrderGroup) => void) {
    setOpen(false);
    action(group);
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button aria-label="Customer order actions" className="h-8 w-8 rounded-lg px-0" variant="outline">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[70] w-44 rounded-xl bg-white p-1 shadow-xl">
        <div className="space-y-1">
          <Button className="h-9 w-full justify-start gap-2 rounded-lg border-transparent bg-transparent px-2 text-sm shadow-none hover:bg-muted" onClick={() => runAction(onOpen)} variant="outline">
            <Eye className="h-4 w-4" />
            View
          </Button>
          {canCreateOrder ? (
            <Button className="h-9 w-full justify-start gap-2 rounded-lg border-transparent bg-transparent px-2 text-sm text-emerald-700 shadow-none hover:bg-emerald-50" onClick={() => runAction(onCreate)} variant="outline">
              <Plus className="h-4 w-4" />
              Create Order
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BatchBadge({ label, index }: { label: string; index: number }) {
  const classes = [
    "border-emerald-200 bg-emerald-100 text-emerald-800",
    "border-blue-200 bg-blue-100 text-blue-800",
    "border-violet-200 bg-violet-100 text-violet-800",
  ];

  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${classes[index % classes.length]}`}>
      {label}
    </span>
  );
}
