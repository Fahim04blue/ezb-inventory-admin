import Link from "next/link";
import { Star } from "lucide-react";

import type { DashboardLowStockItem } from "../types/dashboard.types";
import { DashboardAttentionList } from "./dashboard-attention-list";

export function DashboardLowStockCard({ items }: { items: DashboardLowStockItem[] }) {
  return (
    <DashboardAttentionList title="Low Stock" description="Active variants at or below their alert level." emptyMessage="No low stock items." isEmpty={!items.length} action={<Link href="/inventory/stock" className="text-xs font-medium text-primary">View stock</Link>}>
      <div className="divide-y divide-slate-100">
        {items.slice(0, 5).map((item) => (
          <Link key={item.id} href="/inventory/stock" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
            <div className="min-w-0"><p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-900">{item.isPriority ? <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" /> : null}{item.productName} · {item.variantName}</p><p className="mt-0.5 text-xs text-slate-500">{item.sku || "No SKU"}{item.priorityNote ? ` · ${item.priorityNote}` : ""}</p></div>
            <div className="shrink-0 text-right"><p className={`text-sm font-semibold ${item.currentStock <= 0 ? "text-rose-700" : "text-amber-700"}`}>{item.currentStock} units</p><p className="text-xs text-slate-500">Alert at {item.lowStockAlert}</p></div>
          </Link>
        ))}
      </div>
    </DashboardAttentionList>
  );
}
