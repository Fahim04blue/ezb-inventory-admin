import { formatCurrency } from "@/lib/formatters";
import type { ReportsOverview } from "../types/report.types";
import { ReportsChartCard } from "./reports-chart-card";

export function ReportsExpenseBreakdown({ expenses }: { expenses: ReportsOverview["expenses"] }) {
  const max = Math.max(...expenses.byGroup.map((item) => Number(item.amount)), 0);
  return (
    <ReportsChartCard title="Expense Breakdown" description="Acquisition cash out is kept separate from operating expenses.">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total Expenses", expenses.totalExpenses],
          ["Operating Expenses", expenses.operatingExpenses],
          ["Product Purchase Cash Out", expenses.productPurchaseCashOut],
          ["Cargo / Import Cash Out", expenses.cargoCashOut],
          ["Purchase & Cargo Cash Out", expenses.purchaseAndCargoCashOut],
        ].map(([label, amount]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(amount)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2">
        {expenses.byGroup.map((item) => (
          <div key={item.key}>
            <div className="mb-1 flex justify-between gap-3 text-xs">
              <span className="font-medium text-slate-600">{item.label}</span>
              <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${max ? Math.max(2, Number(item.amount) / max * 100) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </ReportsChartCard>
  );
}
