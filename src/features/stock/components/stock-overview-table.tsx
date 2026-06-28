import { History, SlidersHorizontal, Star } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductVariantThumbnail } from "@/components/common/product-variant-thumbnail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function StockLevelBadge({ item }: { item: StockOverviewItem }) {
  const isLow =
    item.lowStockAlert != null && item.currentStock <= item.lowStockAlert;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium shadow-none",
        isLow
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {item.currentStock.toLocaleString()}
    </Badge>
  );
}

function TrendBadge({ item }: { item: StockOverviewItem }) {
  const trendStyles: Record<string, string> = {
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

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item.isPriority ? (
        <Badge
          variant="outline"
          className="rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 shadow-none"
        >
          Priority
        </Badge>
      ) : null}
      <Badge
        variant="outline"
        className={`rounded-full px-2 py-0.5 text-xs font-medium shadow-none ${trendStyles[item.salesTrend]}`}
      >
        {formatEnum(item.salesTrend)}
      </Badge>
      {item.lowStockAlert != null && item.currentStock <= item.lowStockAlert ? (
        <Badge
          variant="outline"
          className="rounded-full border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 shadow-none"
        >
          Low Stock
        </Badge>
      ) : null}
    </div>
  );
}

export function StockOverviewTable({
  items,
  onAdjust,
  onViewHistory,
  onTogglePriority,
  footer,
}: {
  items: StockOverviewItem[];
  onAdjust: (item: StockOverviewItem) => void;
  onViewHistory: (item: StockOverviewItem) => void;
  onTogglePriority: (item: StockOverviewItem) => void;
  footer?: ReactNode;
}) {
  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="overflow-x-auto">
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow className="border-slate-200 bg-white hover:bg-transparent">
              <TableHead className="px-5 py-3 text-xs font-semibold text-slate-900">
                Product / Variant
              </TableHead>
              <TableHead className="w-[130px] py-3 text-xs font-semibold text-slate-900">
                SKU
              </TableHead>
              <TableHead className="w-[130px] py-3 text-xs font-semibold text-slate-900">
                Current Stock
              </TableHead>
              <TableHead className="w-[130px] py-3 text-right text-xs font-semibold text-slate-900">
                Unit Cost
              </TableHead>
              <TableHead className="w-[140px] py-3 text-right text-xs font-semibold text-slate-900">
                Stock Value
              </TableHead>
              <TableHead className="w-[220px] py-3 text-xs font-semibold text-slate-900">
                Priority / Trend
              </TableHead>
              <TableHead className="w-[170px] py-3 text-xs font-semibold text-slate-900">
                Last Movement
              </TableHead>
              <TableHead className="w-[230px] px-5 py-3 text-right text-xs font-semibold text-slate-900">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-sm text-slate-500"
                >
                  No stock items found.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((item) => (
              <TableRow
                key={item.id}
                className="border-slate-200/90 transition-colors hover:bg-slate-50/80"
              >
                <TableCell className="px-5 py-2.5 align-middle">
                  <div className="flex max-w-[320px] items-center gap-3">
                    <ProductVariantThumbnail
                      imageUrl={item.imageUrl}
                      alt={`${item.productName} ${item.name}`}
                    />
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium text-slate-950">
                        {item.productName}
                      </p>
                      <p className="line-clamp-1 text-xs text-slate-500">
                        {item.name}
                        {[item.brandName, item.categoryName].filter(Boolean).length
                          ? ` • ${[item.brandName, item.categoryName]
                              .filter(Boolean)
                              .join(" • ")}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 align-middle text-xs text-slate-600">
                  {item.sku || "-"}
                </TableCell>
                <TableCell className="py-2.5 align-middle">
                  <StockLevelBadge item={item} />
                </TableCell>
                <TableCell className="py-2.5 text-right align-middle text-sm font-medium text-slate-950">
                  {item.currentLandedCost
                    ? formatCurrency(Number(item.currentLandedCost))
                    : "-"}
                </TableCell>
                <TableCell className="py-2.5 text-right align-middle text-sm font-semibold text-slate-950">
                  {formatCurrency(Number(item.stockValue))}
                </TableCell>
                <TableCell className="py-2.5 align-middle">
                  <TrendBadge item={item} />
                  {item.daysOfStockLeft != null ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {Math.ceil(item.daysOfStockLeft)} days left
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="py-2.5 align-middle">
                  {item.lastMovement ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-slate-700">
                        {formatEnum(item.lastMovement.type)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatMovementDate(item.lastMovement.createdAt)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                </TableCell>
                <TableCell className="px-5 py-2.5 text-right align-middle">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="outline"
                      onClick={() => onTogglePriority(item)}
                      className="h-8 w-8 rounded-lg border-slate-200 bg-white px-0 shadow-none"
                      title={item.isPriority ? "Unpin priority" : "Mark priority"}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          item.isPriority
                            ? "fill-amber-400 text-amber-500"
                            : "text-slate-500"
                        }`}
                      />
                      <span className="sr-only">
                        {item.isPriority ? "Unpin priority" : "Mark priority"}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onAdjust(item)}
                      className="h-8 w-auto rounded-lg border-slate-200 bg-white px-2.5 text-xs shadow-none"
                    >
                      <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                      Adjust
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onViewHistory(item)}
                      className="h-8 w-auto rounded-lg border-slate-200 bg-white px-2.5 text-xs shadow-none"
                    >
                      <History className="mr-1.5 h-3.5 w-3.5" />
                      History
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {footer}
    </div>
  );
}
