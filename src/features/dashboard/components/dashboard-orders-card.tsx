import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { formatCurrency, formatDate, formatEnum } from "@/lib/formatters";
import type { DashboardOrderItem } from "../types/dashboard.types";
import { DashboardAttentionList } from "./dashboard-attention-list";

export function DashboardOrdersCard({ orders }: { orders: DashboardOrderItem[] }) {
  return (
    <DashboardAttentionList title="Orders Needing Action" description="Ready, confirmed, or payment-due orders." emptyMessage="No orders need attention." isEmpty={!orders.length} action={<Link href="/sales/orders" className="text-xs font-medium text-primary">View all</Link>}>
      <div className="divide-y divide-slate-100">
        {orders.slice(0, 5).map((order) => (
          <Link key={order.id} href="/sales/orders" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
            <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{order.orderNumber} · {order.customerName ?? "Walk-in customer"}</p><div className="mt-1 flex items-center gap-1.5"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{formatEnum(order.status)}</span><span className="text-[11px] text-slate-500">{formatDate(order.orderDate)}</span></div></div>
            <div className="shrink-0 text-right"><p className="text-sm font-semibold text-slate-900">{formatCurrency(order.amountReceived)}</p><p className={Number(order.dueAmount) > 0 ? "text-xs text-amber-700" : "text-xs text-slate-500"}>Due {formatCurrency(order.dueAmount)}</p></div><ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </Link>
        ))}
      </div>
    </DashboardAttentionList>
  );
}
