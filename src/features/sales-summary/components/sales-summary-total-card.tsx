import { Banknote } from "lucide-react";

import { formatCurrency } from "@/lib/formatters";

interface SalesSummaryTotalCardProps {
  totalSalesReceived: number;
}

export function SalesSummaryTotalCard({
  totalSalesReceived,
}: SalesSummaryTotalCardProps) {
  return (
    <div className="max-w-md rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Banknote className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-600">
            Total Sales Received
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(totalSalesReceived)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            From current active filtered view
          </p>
        </div>
      </div>
    </div>
  );
}
