import { formatCurrency } from "@/lib/formatters";
import type { ReportsOverview } from "../types/report.types";
import { ReportsChartCard } from "./reports-chart-card";

export function ReportsFinanceOverview({ finance }: { finance: ReportsOverview["finance"] }) {
  const rows = [
    ["Order Product Cost", finance.orderProductCost],
    ["Sales Summary Estimated Cost", finance.salesSummaryEstimatedCost],
    [finance.grossProfitLabel, finance.grossProfit],
    ["Operating Expenses", finance.operatingExpenses],
    ["Net Profit", finance.netProfit],
    ["Total Expenses Tracked", finance.trackedMoneySpent],
  ] as const;

  return (
    <ReportsChartCard title="Profit Breakdown" description="Sales Summary cost is shown only when known.">
      <div className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <span className="text-slate-600">{label}</span>
            <span className={`font-semibold ${value !== null && Number(value) < 0 ? "text-rose-700" : "text-slate-950"}`}>
              {value === null ? "Unknown" : formatCurrency(value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="text-sm font-medium text-emerald-800">Profit Margin</span>
        <span className="text-base font-semibold text-emerald-800">{finance.profitMargin.toFixed(2)}%</span>
      </div>
    </ReportsChartCard>
  );
}
