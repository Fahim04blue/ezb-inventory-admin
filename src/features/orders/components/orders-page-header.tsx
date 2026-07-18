"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type OrdersPageHeaderProps = {
  isRefreshing: boolean;
  onRefresh: () => void;
  onAddOrder: () => void;
};

export function OrdersPageHeader({
  onAddOrder,
}: OrdersPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Orders
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Create normal orders and reserve incoming pre-orders.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button
          className="h-10 w-auto rounded-xl bg-emerald-800 px-4 text-white shadow-sm hover:bg-emerald-900"
          onClick={onAddOrder}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Order
        </Button>
      </div>
    </div>
  );
}
