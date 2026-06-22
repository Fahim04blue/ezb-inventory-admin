"use client";

import {
  Banknote,
  ClipboardList,
  PackageCheck,
  ReceiptText,
} from "lucide-react";

import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { OrderView } from "../types/order.types";

type OrdersSummaryCardsProps = {
  orders: OrderView[];
};

function toAmount(value: string) {
  return Number(value);
}

export function OrdersSummaryCards({ orders }: OrdersSummaryCardsProps) {
  const customerPayable = orders.reduce(
    (sum, order) => sum + toAmount(order.customerPayable),
    0,
  );
  const amountReceived = orders.reduce(
    (sum, order) => sum + toAmount(order.amountReceived),
    0,
  );
  const productCost = orders.reduce((sum, order) => sum + toAmount(order.productCost), 0);
  const netProfit = orders.reduce((sum, order) => sum + toAmount(order.netProfit), 0);

  const cards = [
    {
      label: "Customer Payable",
      value: formatCurrency(customerPayable),
      icon: ReceiptText,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Amount Received",
      value: formatCurrency(amountReceived),
      icon: Banknote,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Product Cost",
      value: formatCurrency(productCost),
      icon: ClipboardList,
      tone: "bg-slate-100 text-slate-700",
    },
    {
      label: "Net / Expected Profit",
      value: formatCurrency(netProfit),
      icon: Banknote,
      tone: netProfit < 0 ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700",
    },
    {
      label: "Orders",
      value: formatNumber(orders.length),
      icon: PackageCheck,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.055)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 truncate text-lg font-semibold text-slate-950">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-full p-2 ${card.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
