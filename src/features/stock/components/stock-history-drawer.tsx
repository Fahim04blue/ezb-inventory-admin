import { useEffect, useState } from "react";
import { RotateCcw, ShoppingBag, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/common/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { StockMovementView, StockOverviewItem } from "../types/stock.types";

function formatMovementDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getMovementMeta(movement: StockMovementView) {
  if (movement.type === "SALE") {
    return {
      icon: ShoppingBag,
      tone: "bg-emerald-50 text-emerald-700",
    };
  }

  if (movement.type === "RETURN") {
    return {
      icon: RotateCcw,
      tone: "bg-amber-50 text-amber-700",
    };
  }

  return {
    icon: SlidersHorizontal,
    tone: "bg-violet-50 text-violet-700",
  };
}

function DirectionBadge({ direction }: { direction: StockMovementView["direction"] }) {
  return (
    <Badge
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium shadow-none",
        direction === "IN"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700",
      )}
      variant="outline"
    >
      {direction}
    </Badge>
  );
}

function MobileMovementCard({ movement }: { movement: StockMovementView }) {
  const meta = getMovementMeta(movement);
  const Icon = meta.icon;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            meta.tone,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">
                {formatEnum(movement.type)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatMovementDate(movement.createdAt)}
              </p>
            </div>
            <DirectionBadge direction={movement.direction} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">Quantity</p>
              <p className="mt-0.5 font-semibold text-slate-950">
                {movement.direction === "IN" ? "+" : "-"}
                {movement.quantity}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">Unit Cost</p>
              <p className="mt-0.5 font-semibold text-slate-950">
                {movement.unitCost ? formatCurrency(Number(movement.unitCost)) : "-"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">Direction</p>
              <p className="mt-0.5 font-medium text-slate-700">
                {movement.direction === "IN" ? "Stock In" : "Stock Out"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">Total Cost</p>
              <p className="mt-0.5 font-medium text-slate-700">
                {movement.totalCost ? formatCurrency(Number(movement.totalCost)) : "-"}
              </p>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="text-[11px] text-slate-500">Note</p>
            <p className="mt-0.5 break-words text-xs leading-5 text-slate-700">
              {movement.note || "-"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function StockHistoryDrawer({
  variant,
  onClose,
}: {
  variant: StockOverviewItem | null;
  onClose: () => void;
}) {
  const [movements, setMovements] = useState<StockMovementView[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadMovements() {
      if (!variant) {
        setMovements([]);
        return;
      }

      setIsLoading(true);

      try {
        const data = await apiClient<{ movements: StockMovementView[] }>(
          `/api/stock-movements?variantId=${variant.id}`,
          {
            cache: "no-store",
            showErrorToast: true,
          },
        );

        if (!isCancelled) {
          setMovements(data.movements);
        }
      } catch {
        if (!isCancelled) {
          setMovements([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMovements();

    return () => {
      isCancelled = true;
    };
  }, [variant]);

  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && onClose()} open={variant !== null}>
      <DialogContent
        className="left-0 top-auto bottom-0 z-[80] flex h-[78dvh] max-h-[78dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-t-[28px] border-slate-200 bg-[#fffdf8] p-0 shadow-[0_-18px_48px_rgba(15,23,42,0.22)] md:left-1/2 md:top-[50%] md:h-auto md:max-h-[85vh] md:max-w-4xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:bg-white md:shadow-lg"
        showCloseButton={false}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-slate-200 px-4 pb-3 pt-3 md:px-6 md:py-5">
            <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-300 md:hidden" />
            <div className="mt-3 flex items-start justify-between gap-4 md:mt-0">
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg font-semibold tracking-tight text-slate-950">
                  Stock Movement History
                </DialogTitle>
                <p className="mt-1 break-words text-sm text-slate-500">
                  {variant
                    ? `${variant.productName} - ${variant.name}`
                    : "View all movements for this product variant."}
                </p>
              </div>
              <Button className="h-10 w-10 shrink-0 px-0" onClick={onClose} type="button" variant="outline">
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
            {isLoading ? (
              <>
                <div className="space-y-3 md:hidden">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div className="h-32 animate-pulse rounded-2xl bg-white" key={index} />
                  ))}
                </div>
                <div className="hidden md:block">
                  <TableSkeleton columns={6} rows={6} />
                </div>
              </>
            ) : movements.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                No movement history found.
              </div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {movements.map((movement) => (
                    <MobileMovementCard key={movement.id} movement={movement} />
                  ))}
                </div>

                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[720px]">
                      <TableHeader>
                        <TableRow className="border-slate-200 bg-white hover:bg-transparent">
                          <TableHead className="px-4 py-3 text-xs font-semibold text-slate-900">
                            Date
                          </TableHead>
                          <TableHead className="py-3 text-xs font-semibold text-slate-900">
                            Type
                          </TableHead>
                          <TableHead className="py-3 text-xs font-semibold text-slate-900">
                            Direction
                          </TableHead>
                          <TableHead className="py-3 text-right text-xs font-semibold text-slate-900">
                            Qty
                          </TableHead>
                          <TableHead className="py-3 text-right text-xs font-semibold text-slate-900">
                            Unit Cost
                          </TableHead>
                          <TableHead className="px-4 py-3 text-xs font-semibold text-slate-900">
                            Note
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.map((movement) => (
                          <TableRow key={movement.id} className="border-slate-200/90">
                            <TableCell className="px-4 py-2.5 text-xs text-slate-600">
                              {formatMovementDate(movement.createdAt)}
                            </TableCell>
                            <TableCell className="py-2.5 text-xs font-medium text-slate-800">
                              {formatEnum(movement.type)}
                            </TableCell>
                            <TableCell className="py-2.5 text-xs text-slate-600">
                              {movement.direction}
                            </TableCell>
                            <TableCell className="py-2.5 text-right text-sm font-medium text-slate-950">
                              {movement.direction === "IN" ? "+" : "-"}
                              {movement.quantity}
                            </TableCell>
                            <TableCell className="py-2.5 text-right text-sm text-slate-700">
                              {movement.unitCost
                                ? formatCurrency(Number(movement.unitCost))
                                : "-"}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-xs text-slate-500">
                              {movement.note || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
