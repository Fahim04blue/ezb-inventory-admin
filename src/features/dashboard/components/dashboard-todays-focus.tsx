import Link from "next/link";
import { ArrowUpRight, Clock3, HandCoins, PackageSearch, Truck, TriangleAlert } from "lucide-react";

import type { DashboardOverview } from "../types/dashboard.types";

export function DashboardTodaysFocus({ focus }: { focus: DashboardOverview["focus"] }) {
  const items = [
    { label: "Ready to deliver", value: focus.readyToDeliver, action: "View orders", href: "/sales/orders", icon: Truck, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Waiting pre-orders", value: focus.waitingPreOrders, action: "View pre-orders", href: "/sales/orders", icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: "Low stock items", value: focus.lowStockItems, action: "View stock", href: "/inventory/stock", icon: TriangleAlert, tone: "bg-rose-50 text-rose-700" },
    { label: "Supplier payments", value: focus.supplierPayments, action: "View purchases", href: "/purchasing/purchases", icon: HandCoins, tone: "bg-orange-50 text-orange-700" },
    { label: "Purchases in cargo", value: focus.incomingPurchases, action: "View purchases", href: "/purchasing/purchases", icon: PackageSearch, tone: "bg-blue-50 text-blue-700" },
  ];
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <h2 className="text-sm font-semibold text-slate-950">Today&apos;s Focus</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {items.map(({ label, value, action, href, icon: Icon, tone }) => (
          <div key={label} className="flex min-w-0 gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="h-4 w-4" /></span>
            <div className="min-w-0"><p className="truncate text-[11px] font-medium text-slate-500">{label}</p><p className="text-base font-semibold text-slate-950">{value.toLocaleString()}</p><Link href={href} className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">{action}<ArrowUpRight className="h-3 w-3" /></Link></div>
          </div>
        ))}
      </div>
    </section>
  );
}
