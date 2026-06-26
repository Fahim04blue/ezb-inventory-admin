"use client";

import { Plus, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PurchaseMobileEmptyState({
  hasFilters,
  onAdd,
  onClear,
}: {
  hasFilters: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-stone-200/90 bg-white px-5 py-8 text-center shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
        <ShoppingBag className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-stone-950">No purchases found</h2>
      <p className="mt-2 text-sm text-stone-600">
        {hasFilters
          ? "No purchases match the selected filters."
          : "Add your first purchase to begin tracking inventory costs."}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        {hasFilters ? (
          <Button className="w-auto rounded-2xl px-4" onClick={onClear} type="button" variant="outline">
            Clear Filters
          </Button>
        ) : (
          <Button className="w-auto rounded-2xl bg-emerald-800 px-4 text-white" onClick={onAdd} type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Purchase
          </Button>
        )}
      </div>
    </div>
  );
}
