import Link from "next/link";

import { formatCurrency, formatDate, formatEnum } from "@/lib/formatters";
import type { DashboardPurchaseItem } from "../types/dashboard.types";
import { DashboardAttentionList } from "./dashboard-attention-list";

function PurchaseRows({ items, payment }: { items: DashboardPurchaseItem[]; payment?: boolean }) {
  return <div className="divide-y divide-slate-100">{items.slice(0, 3).map((purchase) => <Link key={purchase.id} href="/purchasing/purchases" className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{purchase.referenceNumber} · {purchase.supplierName ?? "No supplier"}</p><p className="mt-0.5 text-xs text-slate-500">{formatDate(purchase.purchaseDate)} · {payment ? formatEnum(purchase.paymentStatus) : `${purchase.receivedQuantity}/${purchase.totalQuantity} received`}</p></div><div className="shrink-0 text-right"><p className="text-sm font-semibold text-slate-900">{formatCurrency(purchase.totalLandedCostBdt)}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${payment ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}>{payment ? "Payment attention" : formatEnum(purchase.status)}</span></div></Link>)}</div>;
}

export function DashboardIncomingPurchasesCard({
  incoming,
}: {
  incoming: DashboardPurchaseItem[];
}) {
  return (
    <DashboardAttentionList title="Purchases in Cargo / Incoming" description="Ordered, in-cargo, and partially received purchases." emptyMessage="No purchases in cargo." isEmpty={!incoming.length} action={<Link href="/purchasing/purchases" className="text-xs font-medium text-primary">View all</Link>}><PurchaseRows items={incoming} /></DashboardAttentionList>
  );
}

export function DashboardSupplierPaymentCard({
  paymentAttention,
}: {
  paymentAttention: DashboardPurchaseItem[];
}) {
  return (
    <DashboardAttentionList title="Supplier Payment Attention" description="Unpaid and partially paid supplier purchases." emptyMessage="No supplier payments need attention." isEmpty={!paymentAttention.length} action={<Link href="/purchasing/purchases" className="text-xs font-medium text-primary">View all</Link>}><PurchaseRows items={paymentAttention} payment /></DashboardAttentionList>
  );
}
