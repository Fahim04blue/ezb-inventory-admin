import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Pencil } from "lucide-react";
import { SalesSourceBadge } from "@/features/finance/components/sales-source-badge";
import { type SalesSummaryView } from "../types/sales-summary.types";

export function SalesSummaryMobileCardList({
  salesSummaries,
  onEdit,
  onToggleStatus,
}: {
  salesSummaries: SalesSummaryView[];
  onEdit: (salesSummary: SalesSummaryView) => void;
  onToggleStatus: (salesSummary: SalesSummaryView) => void;
}) {
  if (salesSummaries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500 shadow-sm sm:hidden">
        No sales summaries found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {salesSummaries.map((summary) => {
        const salesAmount = Number(summary.amountBdt);

        return (
          <div
            key={summary.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-950">{summary.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(summary.date)}
                </p>
              </div>
              <div className="text-right">
                <span className="font-semibold tracking-tight text-slate-950">
                  {formatCurrency(salesAmount)}
                </span>
              </div>
            </div>

            {summary.notes && (
              <p className="line-clamp-2 text-sm text-slate-500">
                {summary.notes}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <SalesSourceBadge source={summary.source} />
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Estimated Cost</p>
                <p className="mt-1 font-medium text-slate-900">
                  {summary.estimatedProductCost === null
                    ? "Unknown"
                    : formatCurrency(summary.estimatedProductCost)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Estimated Profit</p>
                <p className={`mt-1 font-semibold ${summary.estimatedGrossProfit !== null && Number(summary.estimatedGrossProfit) < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {summary.estimatedGrossProfit === null
                    ? "Unknown"
                    : formatCurrency(summary.estimatedGrossProfit)}
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={summary.isActive}
                  onCheckedChange={() => onToggleStatus(summary)}
                  aria-label="Toggle active status"
                  className="scale-[0.85]"
                />
                <span className="text-xs font-medium text-slate-500">
                  {summary.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => onEdit(summary)}
                className="h-8 w-auto rounded-lg border-slate-200 bg-white px-3 text-xs shadow-none"
              >
                <Pencil className="mr-2 h-3 w-3" />
                Edit
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
