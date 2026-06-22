import type { LucideIcon } from "lucide-react";
import { Clock3, HandCoins, PackageSearch, ShoppingBag, TriangleAlert, Truck } from "lucide-react";

import type { DashboardOverview } from "../types/dashboard.types";

function CompactFocusGrid({
  items,
}: {
  items: Array<{ label: string; value: number; icon: LucideIcon; tone: string }>;
}) {
  return (
    <div className="grid grid-cols-4 divide-x divide-slate-100 rounded-3xl border border-slate-200/80 bg-white px-1 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div className="min-w-0 px-1 text-center" key={label}>
          <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full ${tone}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="mt-1 block text-sm font-semibold text-slate-950">{value}</span>
          <span className="mt-0.5 block text-[8px] leading-tight text-slate-500 min-[410px]:text-[9px]">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function MobileAttentionStrip({
  focus,
  waitingOrders,
}: {
  focus: DashboardOverview["focus"];
  waitingOrders: number;
}) {
  const items: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    tone: string;
  }> = [
    { label: "Pre-orders", value: focus.waitingPreOrders, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: "Low Stock", value: focus.lowStockItems, icon: TriangleAlert, tone: "bg-rose-50 text-rose-700" },
    { label: "Waiting Orders", value: waitingOrders, icon: ShoppingBag, tone: "bg-violet-50 text-violet-700" },
    { label: "Supplier Payments", value: focus.supplierPayments, icon: HandCoins, tone: "bg-emerald-50 text-emerald-700" },
  ];

  return <CompactFocusGrid items={items} />;
}

export function MobileTodaysFocus({ focus }: { focus: DashboardOverview["focus"] }) {
  const items = [
    { label: "Ready to deliver", value: focus.readyToDeliver, icon: Truck, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Waiting pre-orders", value: focus.waitingPreOrders, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: "Low stock items", value: focus.lowStockItems, icon: TriangleAlert, tone: "bg-rose-50 text-rose-700" },
    { label: "Purchases in cargo", value: focus.incomingPurchases, icon: PackageSearch, tone: "bg-violet-50 text-violet-700" },
  ];

  return (
    <section>
      <h2 className="mb-2.5 text-base font-semibold text-slate-900">Today&apos;s Focus</h2>
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <div className="flex min-h-16 min-w-0 flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white px-1.5 py-2 text-center shadow-sm" key={label}>
            <span className="flex items-center justify-center gap-1.5">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-semibold text-slate-950">{value}</span>
            </span>
            <span className="mt-1 block whitespace-nowrap text-[8px] leading-tight text-slate-500 min-[410px]:text-[9px]">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
