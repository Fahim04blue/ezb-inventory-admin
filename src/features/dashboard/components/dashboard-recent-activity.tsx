import Link from "next/link";
import { Boxes, ReceiptText, ShoppingBag, ShoppingCart } from "lucide-react";

import { formatCurrency, formatDateTime, formatEnum } from "@/lib/formatters";
import type { DashboardActivityItem } from "../types/dashboard.types";
import { DashboardAttentionList } from "./dashboard-attention-list";

const ICONS = { ORDER: ShoppingCart, EXPENSE: ReceiptText, PURCHASE: ShoppingBag, STOCK: Boxes };
const TONES = { ORDER: "bg-emerald-50 text-emerald-700", EXPENSE: "bg-rose-50 text-rose-700", PURCHASE: "bg-blue-50 text-blue-700", STOCK: "bg-violet-50 text-violet-700" };

export function DashboardRecentActivity({ items }: { items: DashboardActivityItem[] }) {
  return (
    <DashboardAttentionList title="Recent Activity" description="Latest orders, expenses, purchases, and stock events." emptyMessage="No recent activity yet." isEmpty={!items.length}>
      <div className="divide-y divide-slate-100">
        {items.slice(0, 6).map((item) => { const Icon = ICONS[item.type]; return <Link key={item.id} href={item.href} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONES[item.type]}`}><Icon className="h-3.5 w-3.5" /></span><div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-1.5"><span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">{formatEnum(item.type)}</span><p className="truncate text-sm font-medium text-slate-900">{item.title}</p></div><p className="truncate text-[11px] text-slate-500">{formatEnum(item.description)} · {formatDateTime(item.occurredAt)}</p></div>{item.amount !== null ? <span className="shrink-0 text-xs font-semibold text-slate-900">{formatCurrency(item.amount)}</span> : null}</Link>; })}
      </div>
    </DashboardAttentionList>
  );
}
