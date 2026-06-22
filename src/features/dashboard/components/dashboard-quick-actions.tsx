import Link from "next/link";
import { ArrowUpRight, BarChart3, CirclePlus, PackagePlus, ReceiptText, SlidersHorizontal } from "lucide-react";

const ACTIONS = [
  { label: "Add Order", helper: "Create sale or pre-order", href: "/sales/orders", icon: CirclePlus, tone: "bg-emerald-50 text-emerald-700" },
  { label: "Add Purchase", helper: "Record supplier order", href: "/purchasing/purchases", icon: PackagePlus, tone: "bg-blue-50 text-blue-700" },
  { label: "Add Expense", helper: "Track business cost", href: "/finance/expenses", icon: ReceiptText, tone: "bg-violet-50 text-violet-700" },
  { label: "Stock Adjustment", helper: "Fix or add stock", href: "/inventory/stock", icon: SlidersHorizontal, tone: "bg-amber-50 text-amber-700" },
  { label: "View Reports", helper: "Full business performance", href: "/finance/reports", icon: BarChart3, tone: "bg-cyan-50 text-cyan-700" },
];

export function DashboardQuickActions() {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-slate-800">Quick Actions</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {ACTIONS.map(({ label, helper, href, icon: Icon, tone }) => (
          <Link key={label} href={href} className="group flex min-h-16 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <span className="flex min-w-0 items-center gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="h-4 w-4" /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-900">{label}</span><span className="block truncate text-[11px] font-normal text-slate-500">{helper}</span></span>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
