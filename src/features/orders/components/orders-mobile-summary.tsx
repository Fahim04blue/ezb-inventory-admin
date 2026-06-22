import { Banknote, ClipboardList, PackageCheck, ReceiptText, TrendingUp } from "lucide-react";

import { formatCurrency } from "@/lib/formatters";
import type { OrderView } from "../types/order.types";

export function OrdersMobileSummary({ orders }: { orders: OrderView[] }) {
  const customerPayable = orders.reduce((sum, order) => sum + Number(order.customerPayable), 0);
  const amountReceived = orders.reduce((sum, order) => sum + Number(order.amountReceived), 0);
  const productCost = orders.reduce((sum, order) => sum + Number(order.productCost), 0);
  const netProfit = orders.reduce((sum, order) => sum + Number(order.netProfit), 0);
  const cards = [
    { label: "Customer Payable", value: formatCurrency(customerPayable), icon: ReceiptText, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Amount Received", value: formatCurrency(amountReceived), icon: Banknote, tone: "bg-violet-50 text-violet-700" },
    { label: "Product Cost", value: formatCurrency(productCost), icon: ClipboardList, tone: "bg-blue-50 text-blue-700" },
    { label: "Net / Expected Profit", value: formatCurrency(netProfit), icon: TrendingUp, tone: netProfit < 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="grid grid-cols-2 gap-2.5">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div className="flex min-h-20 items-center gap-2.5 rounded-2xl border border-slate-200/80 px-3 py-2.5" key={label}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="h-4 w-4" /></span>
            <span className="min-w-0"><span className="block text-[10px] leading-tight text-slate-500">{label}</span><span className="mt-1 block text-[11px] font-semibold leading-tight text-slate-950 min-[390px]:text-xs">{value}</span></span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex min-h-14 items-center justify-between rounded-2xl border border-slate-200/80 px-3">
        <span className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-700"><PackageCheck className="h-4 w-4" /></span><span><span className="block text-xs text-slate-500">Orders</span><span className="block text-base font-semibold text-slate-950">{orders.length}</span></span></span>
      </div>
    </section>
  );
}
