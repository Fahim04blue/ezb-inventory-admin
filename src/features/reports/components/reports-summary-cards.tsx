import {
  Banknote,
  Boxes,
  CircleDollarSign,
  HandCoins,
  PackageCheck,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { formatCurrency } from "@/lib/formatters";
import type { ReportsOverview } from "../types/report.types";

export function ReportsSummaryCards({ summary }: { summary: ReportsOverview["summary"] }) {
  const cards = [
    { label: "Sales Received", value: summary.salesReceived, icon: Banknote, tone: "emerald" },
    { label: "Product Cost Sold", value: summary.productCostSold, icon: PackageCheck, tone: "slate" },
    { label: summary.grossProfitLabel, value: summary.grossProfit, icon: TrendingUp, tone: "emerald" },
    { label: "Operating Expenses", value: summary.operatingExpenses, icon: ReceiptText, tone: "rose" },
    { label: "Net Profit", value: summary.netProfit, icon: CircleDollarSign, tone: Number(summary.netProfit) < 0 ? "rose" : "emerald" },
    { label: "Current Stock Value", value: summary.currentStockValue, icon: Boxes, tone: "blue" },
    { label: "Product Purchase / Inventory Investment", value: summary.purchaseInvestment, icon: WalletCards, tone: "violet" },
    { label: "Pre-order Due", value: summary.preOrderDue, icon: HandCoins, tone: "amber" },
  ];
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tones[card.tone]}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600">{card.label}</p>
                <p className={`mt-1 truncate text-lg font-semibold tracking-tight ${Number(card.value) < 0 ? "text-rose-700" : "text-slate-950"}`}>
                  {formatCurrency(card.value)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
