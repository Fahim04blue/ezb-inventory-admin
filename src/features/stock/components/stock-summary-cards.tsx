import { AlertTriangle, Boxes, Clock3, Wallet } from "lucide-react";

import { formatCurrency } from "@/lib/formatters";
import type { StockSummary } from "../types/stock.types";

export function StockSummaryCards({ summary }: { summary: StockSummary }) {
  const cards = [
    {
      label: "Total Units",
      value: summary.totalUnits.toLocaleString(),
      icon: Boxes,
      classes: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Stock Value",
      value: formatCurrency(Number(summary.stockValue)),
      icon: Wallet,
      classes: "bg-blue-50 text-blue-700",
    },
    {
      label: "Low Stock Items",
      value: summary.lowStockItems.toLocaleString(),
      icon: AlertTriangle,
      classes: "bg-amber-50 text-amber-700",
    },
    {
      label: "Recent Adjustments",
      value: summary.recentAdjustments.toLocaleString(),
      icon: Clock3,
      classes: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${card.classes}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600">{card.label}</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
