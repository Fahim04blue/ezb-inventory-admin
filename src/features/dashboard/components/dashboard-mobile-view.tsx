import Link from "next/link";
import {
  Boxes,
  Clock3,
  PackageOpen,
  ReceiptText,
  ShoppingBag,
  Star,
} from "lucide-react";

import { formatCurrency, formatDate, formatDateTime, formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { DashboardActivityItem, DashboardOverview } from "../types/dashboard.types";
import { MobileDashboardHero } from "./mobile-dashboard-hero";
import { MobileActionGrid } from "./mobile-action-grid";
import { MobileAttentionStrip, MobileTodaysFocus } from "./mobile-attention-strip";
import { MobileSectionCard } from "./mobile-section-card";

function statusTone(status: string) {
  if (status === "READY_TO_DELIVER" || status === "DELIVERED") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "CONFIRMED") {
    return "bg-blue-50 text-blue-700";
  }
  return "bg-amber-50 text-amber-700";
}

function activityIcon(item: DashboardActivityItem) {
  if (item.type === "ORDER") return ShoppingBag;
  if (item.type === "EXPENSE") return ReceiptText;
  if (item.type === "PURCHASE") return PackageOpen;
  return Boxes;
}

export function DashboardMobileView({
  data,
}: {
  data: DashboardOverview;
}) {
  return (
    <div className="min-w-0 space-y-3 md:hidden">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-0.5 text-xs text-slate-500">Today&apos;s overview</p>
      </div>

      <MobileDashboardHero summary={data.summary} />

      <MobileAttentionStrip focus={data.focus} waitingOrders={data.ordersNeedingAction.length} />
      <MobileActionGrid />
      <MobileTodaysFocus focus={data.focus} />

      <MobileSectionCard
        empty={!data.ordersNeedingAction.length}
        emptyMessage="No orders need attention."
        href="/sales/orders"
        subtitle="Ready, confirmed, or payment-due"
        title="Orders Needing Action"
      >
        <div className="divide-y divide-slate-100">
          {data.ordersNeedingAction.slice(0, 3).map((order) => (
            <Link className="flex items-center gap-3 px-3.5 py-2.5" href="/sales/orders" key={order.id}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700"><ShoppingBag className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-slate-900">{order.orderNumber} · {order.customerName ?? "Walk-in"}</span><span className="mt-0.5 block text-[10px] text-slate-500">{formatDate(order.orderDate)}</span></span>
              <span className="shrink-0 text-right"><span className="block text-xs font-semibold text-slate-900">{formatCurrency(order.dueAmount)}</span><span className={cn("mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[9px]", statusTone(order.status))}>{formatEnum(order.status)}</span></span>
            </Link>
          ))}
        </div>
      </MobileSectionCard>

      <MobileSectionCard empty={!data.recentActivity.length} emptyMessage="No recent activity." href="/finance/reports" title="Recent Activity">
        <div className="divide-y divide-slate-100">
          {data.recentActivity.slice(0, 4).map((item) => {
            const Icon = activityIcon(item);
            return (
              <Link className="flex items-center gap-3 px-3.5 py-2.5" href={item.href} key={item.id}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-primary"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-slate-900">{item.title}</span><span className="block truncate text-[10px] text-slate-500">{item.description} · {formatDateTime(item.occurredAt)}</span></span>
                {item.amount !== null ? <span className="shrink-0 text-xs font-semibold text-slate-900">{formatCurrency(item.amount)}</span> : null}
              </Link>
            );
          })}
        </div>
      </MobileSectionCard>

      <MobileSectionCard empty={!data.preOrders.items.length} emptyMessage="No active pre-orders." href="/sales/orders" title="Pre-orders">
        <div className="divide-y divide-slate-100">
          {data.preOrders.items.slice(0, 3).map((order) => (
            <Link className="flex items-center gap-3 px-3.5 py-2.5" href="/sales/orders" key={order.id}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Clock3 className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-slate-900">{order.orderNumber} · {order.customerName ?? "Customer"}</span><span className="block truncate text-[10px] text-slate-500">{formatDate(order.orderDate)}</span></span>
              <span className="shrink-0 text-xs font-semibold text-amber-700">Due {formatCurrency(order.dueAmount)}</span>
            </Link>
          ))}
        </div>
      </MobileSectionCard>

      <MobileSectionCard empty={!data.lowStock.length} emptyMessage="No low stock items." href="/inventory/stock" title="Low Stock">
        <div className="divide-y divide-slate-100">
          {data.lowStock.slice(0, 3).map((item) => (
            <Link className="flex items-center gap-3 px-3.5 py-2.5" href="/inventory/stock" key={item.id}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700">{item.isPriority ? <Star className="h-4 w-4 fill-current" /> : <Boxes className="h-4 w-4" />}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-slate-900">{item.productName} · {item.variantName}</span><span className="block truncate text-[10px] text-slate-500">{item.sku || "No SKU"}</span></span>
              <span className="shrink-0 text-xs font-semibold text-rose-700">{item.currentStock} units</span>
            </Link>
          ))}
        </div>
      </MobileSectionCard>

    </div>
  );
}
