import { formatCurrency } from "@/lib/formatters";
import type { ReportsOverview } from "../types/report.types";
import { ReportsChartCard } from "./reports-chart-card";

export function ReportsInventoryOverview({ inventory }: { inventory: ReportsOverview["inventory"] }) {
  const rows = [
    ["Current Stock Value", formatCurrency(inventory.currentStockValue)],
    ["Total Units in Stock", inventory.totalUnitsInStock.toLocaleString()],
    ["Low Stock Items", inventory.lowStockItems.toLocaleString()],
    ["Product Purchase / Inventory Investment", formatCurrency(inventory.purchaseInvestment)],
    ["Product Purchase Expense Cash Out", formatCurrency(inventory.productPurchaseCashOut)],
    ["Cargo / Import Cash Out", formatCurrency(inventory.cargoCashOut)],
    ["Purchase & Cargo Cash Out", formatCurrency(inventory.purchaseAndCargoCashOut)],
    ["In Cargo Value", formatCurrency(inventory.inCargoValue)],
    ["Ordered Value", formatCurrency(inventory.orderedValue)],
    ["Received Purchase Value", formatCurrency(inventory.receivedPurchaseValue)],
  ];
  return (
    <ReportsChartCard title="Inventory / Purchase Overview" description="Stock value uses the current landed cost used by the Stock page.">
      <div className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <span className="text-slate-600">{label}</span><span className="font-semibold text-slate-950">{value}</span>
          </div>
        ))}
      </div>
    </ReportsChartCard>
  );
}
