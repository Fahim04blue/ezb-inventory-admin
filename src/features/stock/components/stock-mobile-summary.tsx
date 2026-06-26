"use client";

import { AlertTriangle, Boxes, Clock3, Wallet } from "lucide-react";

import { formatCurrency } from "@/lib/formatters";
import type { StockSummary } from "../types/stock.types";

export function StockMobileSummary({ summary }: { summary: StockSummary }) {
  const cards = [
    {
      label: "Total Units",
      value: summary.totalUnits.toLocaleString(),
      icon: Boxes,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Stock Value",
      value: formatCurrency(Number(summary.stockValue)),
      icon: Wallet,
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Low Stock Items",
      value: summary.lowStockItems.toLocaleString(),
      icon: AlertTriangle,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Recent Adjustments",
      value: summary.recentAdjustments.toLocaleString(),
      icon: Clock3,
      tone: "bg-fuchsia-50 text-fuchsia-700",
    },
  ];

  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="grid grid-cols-2 gap-2">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div
            className="flex min-h-[68px] items-center gap-2 rounded-[18px] border border-slate-200/80 px-2.5 py-2"
            key={label}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[9px] leading-tight text-slate-500">
                {label}
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold leading-tight text-slate-950 min-[390px]:text-[11px]">
                {value}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex min-h-12 items-center justify-between rounded-[18px] border border-slate-200/80 px-2.5">
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <Boxes className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="block text-[10px] text-slate-500">Stock Health</span>
            <span className="block text-sm font-semibold text-slate-950">
              {summary.lowStockItems > 0 ? "Needs Attention" : "Stable"}
            </span>
          </span>
        </span>
      </div>
    </section>
  );
}
