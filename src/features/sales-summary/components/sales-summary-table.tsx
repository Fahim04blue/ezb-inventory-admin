import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { SalesSourceBadge } from "@/features/finance/components/sales-source-badge";
import { type SalesSummaryView } from "../types/sales-summary.types";

function SalesSummaryStatusIndicator({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        isActive ? "text-emerald-700" : "text-slate-500",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isActive ? "bg-emerald-500" : "bg-slate-300",
        )}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function SalesSummaryTable({
  salesSummaries,
  onEdit,
  onToggleStatus,
}: {
  salesSummaries: SalesSummaryView[];
  onEdit: (salesSummary: SalesSummaryView) => void;
  onToggleStatus: (salesSummary: SalesSummaryView) => void;
}) {
  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="overflow-x-auto">
        <Table className="min-w-[1120px]">
          <TableHeader>
            <TableRow className="border-slate-200 bg-white hover:bg-transparent">
              <TableHead className="w-[128px] px-5 py-3 text-xs font-semibold text-slate-900">Date</TableHead>
              <TableHead className="py-3 text-xs font-semibold text-slate-900">Title &amp; Notes</TableHead>
              <TableHead className="w-[150px] py-3 text-xs font-semibold text-slate-900">Source</TableHead>
              <TableHead className="w-[180px] py-3 text-right text-xs font-semibold text-slate-900">Amount Received</TableHead>
              <TableHead className="w-[150px] py-3 text-right text-xs font-semibold text-slate-900">Estimated Cost</TableHead>
              <TableHead className="w-[150px] py-3 text-right text-xs font-semibold text-slate-900">Estimated Profit</TableHead>
              <TableHead className="w-[150px] py-3 text-xs font-semibold text-slate-900">Status</TableHead>
              <TableHead className="w-[80px] px-5 py-3 text-right text-xs font-semibold text-slate-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesSummaries.map((summary) => {
              const salesAmount = Number(summary.amountBdt);

              return (
                <TableRow key={summary.id} className="border-slate-200/90 transition-colors hover:bg-slate-50/80">
                  <TableCell className="whitespace-nowrap px-5 py-2.5 align-middle text-xs font-medium text-slate-700">
                    {formatDate(summary.date)}
                  </TableCell>
                  <TableCell className="py-2.5 align-middle">
                    <div className="max-w-[420px] space-y-0.5">
                      <span className="text-sm font-medium text-slate-950">{summary.title}</span>
                      {summary.notes && (
                        <span className="line-clamp-1 text-xs text-slate-500" title={summary.notes}>
                          {summary.notes}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 align-middle">
                    <SalesSourceBadge source={summary.source} className="py-0.5 text-xs" />
                  </TableCell>
                  <TableCell className="py-2.5 text-right align-middle">
                    <span className="text-sm font-semibold tracking-tight text-slate-950">
                      {formatCurrency(salesAmount)}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 text-right align-middle text-sm font-medium text-slate-700">
                    {summary.estimatedProductCost === null
                      ? <span className="text-xs text-slate-400">Unknown</span>
                      : formatCurrency(summary.estimatedProductCost)}
                  </TableCell>
                  <TableCell className="py-2.5 text-right align-middle text-sm font-semibold">
                    {summary.estimatedGrossProfit === null ? (
                      <span className="text-xs font-medium text-slate-400">Unknown</span>
                    ) : (
                      <span className={Number(summary.estimatedGrossProfit) < 0 ? "text-rose-700" : "text-emerald-700"}>
                        {formatCurrency(summary.estimatedGrossProfit)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 align-middle">
                    <div className="flex items-center gap-2">
                      <SalesSummaryStatusIndicator isActive={summary.isActive} />
                      <Switch
                        checked={summary.isActive}
                        onCheckedChange={() => onToggleStatus(summary)}
                        aria-label="Toggle active status"
                        className="scale-[0.85]"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-2.5 text-right align-middle">
                    <Button
                      variant="outline"
                      onClick={() => onEdit(summary)}
                      className="h-8 w-8 rounded-lg border-slate-200 bg-white px-0 shadow-none"
                      title="Edit sales summary"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {salesSummaries.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-slate-500">
                  No sales summaries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
