import { formatCurrency, formatEnum } from "@/lib/formatters";
import type { ReportsOverview, TopProductReport } from "../types/report.types";
import { ReportsChartCard } from "./reports-chart-card";
import { ReportsTableCard } from "./reports-table-card";

function TopProductsTable({ rows, value }: { rows: TopProductReport[]; value: "quantity" | "revenue" | "profit" }) {
  if (!rows.length) {
    return <p className="px-4 py-8 text-center text-sm text-slate-500">No sales data yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr><th className="px-4 py-2.5">Product</th><th className="px-4 py-2.5 text-right">Result</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.productVariantId}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{row.name}</p>
                <p className="text-xs text-slate-500">{row.sku || "No SKU"}</p>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                {value === "quantity" ? `${row.quantity.toLocaleString()} units` : formatCurrency(row[value])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsSalesBreakdown({
  sales,
  topProducts,
}: {
  sales: ReportsOverview["sales"];
  topProducts: ReportsOverview["topProducts"];
}) {
  const maxSource = Math.max(...sales.bySource.map((item) => Number(item.amount)), 0);
  return (
    <div className="space-y-3">
      <ReportsChartCard title="Sales Breakdown" description="Detailed orders and historical sales summaries.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Order Sales Received", formatCurrency(sales.orderSalesReceived)],
            ["Sales Summary Received", formatCurrency(sales.salesSummaryReceived)],
            ["Realized Orders", sales.realizedOrdersCount.toLocaleString()],
            ["Average Order Value", formatCurrency(sales.averageOrderValue)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {sales.bySource.map((item) => (
            <div key={item.key}>
              <div className="mb-1 flex justify-between gap-3 text-xs">
                <span className="font-medium text-slate-600">{formatEnum(item.label)}</span>
                <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${maxSource ? Math.max(2, Number(item.amount) / maxSource * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ReportsChartCard>
      <div className="grid gap-3 lg:grid-cols-3">
        <ReportsTableCard title="Top Products by Quantity"><TopProductsTable rows={topProducts.byQuantity} value="quantity" /></ReportsTableCard>
        <ReportsTableCard title="Top Products by Revenue"><TopProductsTable rows={topProducts.byRevenue} value="revenue" /></ReportsTableCard>
        <ReportsTableCard title="Top Products by Profit"><TopProductsTable rows={topProducts.byProfit} value="profit" /></ReportsTableCard>
      </div>
    </div>
  );
}
