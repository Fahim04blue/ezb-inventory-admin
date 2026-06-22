import { Banknote, Boxes, CalendarDays, CircleDollarSign, Clock3, TriangleAlert } from "lucide-react";

import { formatCurrency } from "@/lib/formatters";
import type { DashboardOverview } from "../types/dashboard.types";

export function DashboardSummaryCards({ summary }: { summary: DashboardOverview["summary"] }) {
  const cards = [
    { label: "Today Sales Received", value: formatCurrency(summary.todaySalesReceived), helper: "Received today", icon: Banknote, tone: "bg-emerald-50 text-emerald-700" },
    { label: "This Month Sales Received", value: formatCurrency(summary.monthSalesReceived), helper: "Current month", icon: CalendarDays, tone: "bg-blue-50 text-blue-700" },
    { label: "This Month Net Profit", value: formatCurrency(summary.monthNetProfit), helper: "After operating expenses", icon: CircleDollarSign, tone: Number(summary.monthNetProfit) < 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700" },
    { label: "Current Stock Value", value: formatCurrency(summary.currentStockValue), helper: "Physical stock on hand", icon: Boxes, tone: "bg-violet-50 text-violet-700" },
    { label: "Active Pre-orders", value: summary.activePreOrders.toLocaleString(), helper: "Waiting and active", icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: "Low Stock Items", value: summary.lowStockItems.toLocaleString(), helper: "Need attention", icon: TriangleAlert, tone: "bg-rose-50 text-rose-700" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ label, value, helper, icon: Icon, tone }) => (
        <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="h-4.5 w-4.5" /></span>
            <div className="min-w-0"><p className="truncate text-[11px] font-medium text-slate-600">{label}</p><p className="mt-0.5 truncate text-base font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 truncate text-[10px] text-slate-500">{helper}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}
