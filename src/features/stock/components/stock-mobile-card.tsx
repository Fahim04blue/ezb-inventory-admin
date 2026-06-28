"use client";

import { ChevronRight, History, SlidersHorizontal, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductVariantThumbnail } from "@/components/common/product-variant-thumbnail";
import { formatCurrency, formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { StockOverviewItem } from "../types/stock.types";

function formatMovementDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getStockStatus(item: StockOverviewItem) {
  if (item.currentStock === 0) {
    return {
      label: "Out of Stock",
      tone: "border-slate-200 bg-slate-100 text-slate-700",
      valueTone: "text-slate-700",
    };
  }

  if (item.lowStockAlert != null && item.currentStock <= item.lowStockAlert) {
    return {
      label: "Low Stock",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      valueTone: "text-orange-600",
    };
  }

  return {
    label: "In Stock",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    valueTone: "text-emerald-700",
  };
}

function getTrendTone(trend: StockOverviewItem["salesTrend"]) {
  const styles: Record<StockOverviewItem["salesTrend"], string> = {
    MANUAL_PRIORITY: "border-amber-200 bg-amber-50 text-amber-700",
    RUNNING_OUT: "border-red-200 bg-red-50 text-red-700",
    FAST_MOVING: "border-emerald-200 bg-emerald-50 text-emerald-700",
    LOW_STOCK: "border-orange-200 bg-orange-50 text-orange-700",
    OUT_OF_STOCK: "border-slate-200 bg-slate-100 text-slate-600",
    SLOW_MOVING: "border-blue-200 bg-blue-50 text-blue-700",
    NO_SALES: "border-stone-200 bg-stone-50 text-stone-600",
    OVERSTOCKED: "border-violet-200 bg-violet-50 text-violet-700",
    NORMAL: "border-slate-200 bg-white text-slate-600",
  };

  return styles[trend];
}

function formatTrendLabel(item: StockOverviewItem) {
  if (item.isPriority && item.salesTrend === "MANUAL_PRIORITY") {
    return "Manual Priority";
  }

  return formatEnum(item.salesTrend);
}

export function StockMobileCard({
  item,
  onAdjust,
  onViewHistory,
  onTogglePriority,
}: {
  item: StockOverviewItem;
  onAdjust: (item: StockOverviewItem) => void;
  onViewHistory: (item: StockOverviewItem) => void;
  onTogglePriority: (item: StockOverviewItem) => void;
}) {
  const status = getStockStatus(item);

  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ProductVariantThumbnail
            imageUrl={item.imageUrl}
            alt={`${item.productName} ${item.name}`}
            className="h-12 w-12 rounded-lg"
          />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-slate-950">
              {item.productName}
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-slate-600">
              {item.name}
              {[item.brandName, item.categoryName].filter(Boolean).length
                ? ` • ${[item.brandName, item.categoryName].filter(Boolean).join(" • ")}`
                : ""}
            </p>
            <p className="mt-0.5 text-[13px] text-slate-500">SKU: {item.sku || "N/A"}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-none",
              status.tone,
            )}
            variant="outline"
          >
            {status.label}
          </Badge>
          <span className={cn("rounded-full border px-3 py-0.5 text-[15px] font-medium", status.tone)}>
            {item.currentStock}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-3">
        <div className="min-w-0 px-2 first:pl-0">
          <p className="text-[12px] text-slate-500">Current Stock</p>
          <p className={cn("mt-1.5 text-[15px] font-semibold", status.valueTone)}>
            {item.currentStock}
          </p>
        </div>
        <div className="min-w-0 px-3">
          <p className="text-[12px] text-slate-500">Unit Cost</p>
          <p className="mt-1.5 truncate text-[15px] font-semibold text-slate-950">
            {item.currentLandedCost ? formatCurrency(Number(item.currentLandedCost)) : "-"}
          </p>
        </div>
        <div className="min-w-0 px-3 pr-0">
          <p className="text-[12px] text-slate-500">Stock Value</p>
          <p className="mt-1.5 truncate text-[15px] font-semibold text-slate-950">
            {formatCurrency(Number(item.stockValue))}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {item.isPriority ? (
          <Badge
            className="rounded-full border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 shadow-none"
            variant="outline"
          >
            Priority
          </Badge>
        ) : null}
        <Badge
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-medium shadow-none",
            getTrendTone(item.salesTrend),
          )}
          variant="outline"
        >
          {formatTrendLabel(item)}
        </Badge>
        {item.daysOfStockLeft != null ? (
          <Badge
            className="rounded-full border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 shadow-none"
            variant="outline"
          >
            {Math.ceil(item.daysOfStockLeft)} days left
          </Badge>
        ) : null}
      </div>

      <button
        className="mt-3 flex w-full items-center justify-between border-t border-slate-200 pt-3 text-left"
        onClick={() => onViewHistory(item)}
        type="button"
      >
        <div className="min-w-0">
          <p className="text-[12px] text-slate-500">Last Movement</p>
          <p className="mt-0.5 truncate text-[15px] text-slate-950">
            <span className="font-semibold text-emerald-700">
              {item.lastMovement ? formatEnum(item.lastMovement.type) : "-"}
            </span>
            {item.lastMovement ? ` • ${formatMovementDate(item.lastMovement.createdAt)}` : ""}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
      </button>

      <div className="mt-3 grid grid-cols-[76px_minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <Button
          className="h-10 rounded-xl border-slate-200 bg-white px-0 text-amber-500 shadow-none"
          onClick={() => onTogglePriority(item)}
          title={item.isPriority ? "Unpin priority" : "Mark priority"}
          type="button"
          variant="outline"
        >
          <Star className={cn("h-4 w-4", item.isPriority && "fill-amber-400")} />
          <span className="sr-only">
            {item.isPriority ? "Unpin priority" : "Mark priority"}
          </span>
        </Button>
        <Button
          className="h-10 rounded-xl border-slate-200 bg-white text-[13px] text-slate-900 shadow-none"
          onClick={() => onAdjust(item)}
          type="button"
          variant="outline"
        >
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          Adjust
        </Button>
        <Button
          className="h-10 rounded-xl border-slate-200 bg-white text-[13px] text-slate-900 shadow-none"
          onClick={() => onViewHistory(item)}
          type="button"
          variant="outline"
        >
          <History className="mr-1.5 h-3.5 w-3.5" />
          History
        </Button>
      </div>
    </article>
  );
}
