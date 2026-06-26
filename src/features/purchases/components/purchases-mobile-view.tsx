"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PurchaseMobileCard } from "./purchase-mobile-card";
import { PurchaseMobileDetailsSheet } from "./purchase-mobile-details-sheet";
import { PurchaseMobileEmptyState } from "./purchase-mobile-empty-state";
import { PurchasesMobileFilters, type MobilePurchaseDraftFilters } from "./purchases-mobile-filters";
import { PurchasesMobileHeader } from "./purchases-mobile-header";
import { type PurchaseView } from "../types/purchase.types";

export type MobilePurchaseSort = "NEWEST" | "OLDEST" | "HIGHEST_LANDED" | "LOWEST_LANDED";

const sortLabels: Record<MobilePurchaseSort, string> = {
  NEWEST: "Newest",
  OLDEST: "Oldest",
  HIGHEST_LANDED: "Highest Landed Cost",
  LOWEST_LANDED: "Lowest Landed Cost",
};

type Props = {
  countries: string[];
  draftFilters: MobilePurchaseDraftFilters;
  hasActiveFilters: boolean;
  hasMore: boolean;
  isLoading: boolean;
  onAdd: () => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onEdit: (purchase: PurchaseView) => void;
  onFilterDraftChange: (filters: MobilePurchaseDraftFilters) => void;
  onLoadMore: () => void;
  onOpenDetails: (purchase: PurchaseView | null) => void;
  onReceiveStock: (purchase: PurchaseView) => void;
  onUpdatePayment: (purchase: PurchaseView) => void;
  onUpdateSort: (sort: MobilePurchaseSort) => void;
  selectedPurchase: PurchaseView | null;
  sort: MobilePurchaseSort;
  suppliers: Array<{ id: number; name: string }>;
  visiblePurchases: PurchaseView[];
};

export function PurchasesMobileView({
  countries,
  draftFilters,
  hasActiveFilters,
  hasMore,
  isLoading,
  onAdd,
  onApplyFilters,
  onClearFilters,
  onEdit,
  onFilterDraftChange,
  onLoadMore,
  onOpenDetails,
  onReceiveStock,
  onUpdatePayment,
  onUpdateSort,
  selectedPurchase,
  sort,
  suppliers,
  visiblePurchases,
}: Props) {
  return (
    <div className="space-y-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:hidden">
      <PurchasesMobileHeader onAdd={onAdd} />

      <PurchasesMobileFilters
        countries={countries}
        filters={draftFilters}
        hasActiveFilters={hasActiveFilters}
        onApply={onApplyFilters}
        onChange={onFilterDraftChange}
        onClear={onClearFilters}
        suppliers={suppliers}
      />

      <div className="flex items-center justify-between gap-3 px-1 pt-2">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Recent Purchases</h2>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-sm text-stone-600">
          <span className="leading-none">Sort:</span>
          <div className="relative">
            <select
              className="h-9 min-w-[7.25rem] appearance-none rounded-xl border border-stone-200 bg-white py-0 pl-3 pr-8 text-sm text-stone-700 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => onUpdateSort(event.target.value as MobilePurchaseSort)}
              value={sort}
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-[28px] bg-white" />
          ))}
        </div>
      ) : visiblePurchases.length ? (
        <>
          <div className="space-y-3">
            {visiblePurchases.map((purchase, index) => (
              <PurchaseMobileCard
                index={index}
                key={purchase.id}
                onOpen={onOpenDetails}
                purchase={purchase}
              />
            ))}
          </div>
          {hasMore ? (
            <Button
              className="h-12 w-full rounded-2xl border-stone-200 bg-white text-stone-800"
              onClick={onLoadMore}
              type="button"
              variant="outline"
            >
              Load More
            </Button>
          ) : null}
        </>
      ) : (
        <PurchaseMobileEmptyState
          hasFilters={hasActiveFilters}
          onAdd={onAdd}
          onClear={onClearFilters}
        />
      )}

      <PurchaseMobileDetailsSheet
        onClose={() => onOpenDetails(null)}
        onEdit={onEdit}
        onReceiveStock={onReceiveStock}
        onUpdatePayment={onUpdatePayment}
        open={Boolean(selectedPurchase)}
        purchase={selectedPurchase}
      />
    </div>
  );
}
