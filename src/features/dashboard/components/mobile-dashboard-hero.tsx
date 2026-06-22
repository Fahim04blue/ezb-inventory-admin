import {
  Banknote,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Clock3,
} from "lucide-react";

import { formatCurrency } from "@/lib/formatters";
import type { DashboardOverview } from "../types/dashboard.types";
import { MobileMetricCard } from "./mobile-metric-card";

export function MobileDashboardHero({
  summary,
}: {
  summary: DashboardOverview["summary"];
}) {
  const metrics = [
    { label: "This Month Sales", value: formatCurrency(summary.monthSalesReceived), helper: "Current month", icon: CalendarDays, tone: "bg-violet-50 text-violet-700" },
    { label: "Net Profit", value: formatCurrency(summary.monthNetProfit), helper: "After expenses", icon: CircleDollarSign, tone: Number(summary.monthNetProfit) < 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700" },
    { label: "Stock Value", value: formatCurrency(summary.currentStockValue), helper: "On hand", icon: Boxes, tone: "bg-fuchsia-50 text-fuchsia-700" },
    { label: "Active Pre-orders", value: summary.activePreOrders.toLocaleString(), helper: "Waiting & active", icon: Clock3, tone: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="grid h-[220px] grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 min-[410px]:h-[160px]">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(145deg,#147a5b_0%,#064536_100%)] p-3.5 text-white shadow-[0_12px_26px_rgba(6,69,54,0.22)]">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <Banknote className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-[11px] font-medium leading-snug text-emerald-50">Today Sales Received</p>
          <p className="mt-1.5 whitespace-nowrap text-[clamp(1rem,4.4vw,1.3rem)] font-semibold tracking-tight">{formatCurrency(summary.todaySalesReceived)}</p>
          <p className="mt-1 text-[11px] text-emerald-100/85">Received today</p>
          <svg aria-hidden="true" className="mt-auto h-11 w-full" preserveAspectRatio="none" viewBox="0 0 160 50">
            <path d="M0 42 C18 38 25 41 39 31 C53 22 62 32 76 24 C91 15 103 32 119 20 C134 9 142 15 160 4" fill="none" stroke="rgba(52,211,153,.95)" strokeWidth="2" />
            <circle cx="160" cy="4" fill="white" r="3" />
          </svg>
          <div className="mt-1 flex items-center justify-between text-[9px] text-emerald-50">
            <span>— vs yesterday</span>
            <span className="rounded-full bg-white/10 px-2 py-1">0%</span>
          </div>
        </div>
      </section>

      <div className="grid min-h-0 grid-cols-2 gap-3">
        {metrics.map((metric) => <MobileMetricCard key={metric.label} {...metric} />)}
      </div>
    </div>
  );
}
