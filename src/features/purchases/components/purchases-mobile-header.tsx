"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PurchasesMobileHeader({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950">
          Purchases
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Manage product purchases, shipments, and landed costs.
        </p>
      </div>

      <Button
        className="h-10 w-auto shrink-0 rounded-xl bg-emerald-800 px-3.5 text-white"
        onClick={onAdd}
        type="button"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add Purchase
      </Button>
    </div>
  );
}
