"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { Button } from "@/components/ui/button";
import type { StockFilters, StockOverviewItem, StockSummary } from "../types/stock.types";
import { StockMobileCard } from "./stock-mobile-card";
import { StockMobileFilters } from "./stock-mobile-filters";
import { StockMobileSummary } from "./stock-mobile-summary";

export function StockMobileView({
  summary,
  filters,
  productOptions,
  items,
  isLoading,
  currentPage,
  totalPages,
  totalItems,
  onAdd,
  onFilterChange,
  onClearFilters,
  onPageChange,
  onAdjust,
  onViewHistory,
  onTogglePriority,
}: {
  summary: StockSummary;
  filters: StockFilters;
  productOptions: { id: number; name: string }[];
  items: StockOverviewItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onAdd: () => void;
  onRefresh: () => void;
  onFilterChange: <K extends keyof StockFilters>(key: K, value: StockFilters[K]) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onAdjust: (item: StockOverviewItem) => void;
  onViewHistory: (item: StockOverviewItem) => void;
  onTogglePriority: (item: StockOverviewItem) => void;
}) {
  return (
    <div className="space-y-4 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Stock
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage physical stock and movements.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            className="h-10 rounded-2xl bg-emerald-800 px-4 text-white shadow-sm"
            onClick={onAdd}
            type="button"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Adjust
          </Button>
        </div>
      </div>

      <StockMobileSummary summary={summary} />

      <StockMobileFilters
        filters={filters}
        onClearFilters={onClearFilters}
        onFilterChange={onFilterChange}
        productOptions={productOptions}
      />

      {isLoading ? (
        <CardListSkeleton cards={3} />
      ) : items.length ? (
        <div className="space-y-4">
          {items.map((item) => (
            <StockMobileCard
              item={item}
              key={item.id}
              onAdjust={onAdjust}
              onTogglePriority={onTogglePriority}
              onViewHistory={onViewHistory}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-8 text-center shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
          <h2 className="text-base font-semibold text-slate-950">
            No stock items found
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Adjust filters or add stock movement.
          </p>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2.5 text-xs text-slate-500 shadow-sm">
          <span>
            {totalItems} items · Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <Button
              aria-label="Previous page"
              className="h-8 w-8 px-0"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              type="button"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Next page"
              className="h-8 w-8 px-0"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              type="button"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
