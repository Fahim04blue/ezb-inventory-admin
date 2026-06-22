import Link from "next/link";

import { formatCurrency, formatDate } from "@/lib/formatters";
import type { DashboardOverview } from "../types/dashboard.types";
import { DashboardAttentionList } from "./dashboard-attention-list";

export function DashboardPreordersCard({ preOrders }: { preOrders: DashboardOverview["preOrders"] }) {
  return (
    <DashboardAttentionList title="Pre-orders" description="Incoming reservations and readiness." emptyMessage="No active pre-orders." isEmpty={!preOrders.items.length && preOrders.readyToDeliverCount === 0} action={<Link href="/sales/orders" className="text-xs font-medium text-primary">View orders</Link>}>
      <div className="grid grid-cols-3 gap-2 border-b border-slate-100 p-3">
        {[["Ready", preOrders.readyToDeliverCount], ["Waiting", preOrders.waitingForStockCount], ["Active Due", formatCurrency(preOrders.activeDue)]].map(([label, value]) => <div key={label} className="rounded-xl bg-amber-50 p-2 text-center"><p className="text-[11px] text-amber-800">{label}</p><p className="mt-0.5 text-sm font-semibold text-amber-900">{value}</p></div>)}
      </div>
      <div className="divide-y divide-slate-100">
        {preOrders.items.slice(0, 5).map((order) => <div key={order.id} className="flex justify-between gap-3 px-4 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{order.orderNumber} · {order.customerName ?? "Customer"}</p><p className="mt-0.5 truncate text-xs text-slate-500">{formatDate(order.orderDate)}{order.customerPhone ? ` · ${order.customerPhone}` : ""}</p><span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">Waiting for stock</span></div><div className="shrink-0 text-right"><p className="text-xs text-slate-500">Due</p><p className="text-sm font-semibold text-amber-700">{formatCurrency(order.dueAmount)}</p></div></div>)}
      </div>
    </DashboardAttentionList>
  );
}
