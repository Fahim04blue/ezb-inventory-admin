import { BarChart3, CirclePlus, PackagePlus, ReceiptText } from "lucide-react";
import Link from "next/link";

const ACTIONS = [
  { label: "Add Order", href: "/sales/orders", icon: CirclePlus, tone: "bg-emerald-50 text-emerald-700" },
  { label: "Add Purchase", href: "/purchasing/purchases", icon: PackagePlus, tone: "bg-blue-50 text-blue-700" },
  { label: "Add Expense", href: "/finance/expenses", icon: ReceiptText, tone: "bg-violet-50 text-violet-700" },
  { label: "Reports", href: "/finance/reports", icon: BarChart3, tone: "bg-cyan-50 text-cyan-700" },
];

export function MobileActionGrid() {
  return (
    <section>
      <h2 className="mb-2.5 text-base font-semibold text-slate-900">Quick Actions</h2>
      <div className="grid grid-cols-4 gap-2.5">
        {ACTIONS.map(({ label, href, icon: Icon, tone }) => (
          <Link
            className="flex min-h-18 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white px-1 py-2 text-center shadow-[0_7px_18px_rgba(15,23,42,0.06)]"
            href={href}
            key={label}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-medium leading-tight text-slate-800">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
