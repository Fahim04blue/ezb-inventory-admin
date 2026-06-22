import { formatCurrency } from "@/lib/formatters";
import type { ReportsOverview } from "../types/report.types";
import { ReportsChartCard } from "./reports-chart-card";

export function ReportsPreorderOverview({ preOrders }: { preOrders: ReportsOverview["preOrders"] }) {
  const rows = [
    ["Active Pre-orders", preOrders.activePreOrders.toLocaleString()],
    ["Pre-order Value", formatCurrency(preOrders.preOrderValue)],
    ["Advance Received", formatCurrency(preOrders.advanceReceived)],
    ["Due Amount", formatCurrency(preOrders.dueAmount)],
    ["Expected Profit", formatCurrency(preOrders.expectedProfit)],
    ["Ready to Deliver", preOrders.readyToDeliverCount.toLocaleString()],
    ["Not Received", preOrders.notReceivedCount.toLocaleString()],
  ];
  return (
    <ReportsChartCard title="Pre-order Overview" description="PRE_ORDERED amounts are not counted as realized sales or profit.">
      <div className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <span className="text-slate-600">{label}</span>
            <span className={`font-semibold ${label === "Due Amount" ? "text-amber-700" : "text-slate-950"}`}>{value}</span>
          </div>
        ))}
      </div>
    </ReportsChartCard>
  );
}
