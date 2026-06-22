import { useEffect, useState } from "react";

import { CrudDrawer } from "@/components/common/crud-drawer";
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
    <CrudDrawer
      open={variant !== null}
      onClose={onClose}
      title="Stock Movement History"
      description={
        variant
          ? `${variant.productName} - ${variant.name}`
          : "View all movements for this product variant."
      }
    >
      {isLoading ? (
        <TableSkeleton columns={6} rows={6} />
      ) : movements.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No movement history found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
      )}
    </CrudDrawer>
  );
}
