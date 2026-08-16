import { Banknote, CircleDollarSign, TrendingUp } from "lucide-react";

import { formatCurrency } from "@/lib/formatters";
import type { SheinBatchView } from "../types/shein.types";

export function SheinBatchSummaryCards({ batches }: { batches: SheinBatchView[] }) {
  const items = batches.flatMap((batch) => batch.items ?? []);
  const finalizedOrders = new Map<number, {
    courierDeduction: number;
    netProfit: number;
    productCost: number;
  }>();

  for (const item of items) {
    if (!item.movedToOrderId || finalizedOrders.has(item.movedToOrderId)) continue;
    finalizedOrders.set(item.movedToOrderId, {
      courierDeduction: Number(item.movedToOrderCourierDeduction ?? 0),
      netProfit: Number(item.movedToOrderNetProfit ?? 0),
      productCost: Number(item.movedToOrderProductCost ?? 0),
    });
  }

  const finalized = Array.from(finalizedOrders.values());
  const openItemCost = items
    .filter((item) => !item.movedToOrderId && item.status !== "CANCELLED")
    .reduce(
      (total, item) => total + Number(
        item.totalActualCostBdt
          ?? (Number(item.actualItemCostBdt ?? 0) + Number(item.actualCargoCostBdt ?? 0)),
      ),
      0,
    );
  const totalSpent = finalized.reduce((total, order) => total + order.productCost, openItemCost);
  const grossProfit = finalized.reduce(
    (total, order) => total + order.netProfit + order.courierDeduction,
    0,
  );
  const netProfit = finalized.reduce((total, order) => total + order.netProfit, 0);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <SummaryCard
        helper="Lifetime finalized and open product cost"
        icon={Banknote}
        label="Total Spent"
        tone="amber"
        value={formatCurrency(totalSpent)}
      />
      <SummaryCard
        helper="Before courier and COD deductions"
        icon={CircleDollarSign}
        label="Gross Profit"
        tone={grossProfit < 0 ? "rose" : "blue"}
        value={formatCurrency(grossProfit)}
      />
      <SummaryCard
        helper="After courier and COD deductions"
        icon={TrendingUp}
        label="Net Profit"
        tone={netProfit < 0 ? "rose" : "green"}
        value={formatCurrency(netProfit)}
      />
    </div>
  );
}

function SummaryCard({
  helper,
  icon: Icon,
  label,
  tone,
  value,
}: {
  helper: string;
  icon: typeof Banknote;
  label: string;
  tone: "amber" | "blue" | "green" | "rose";
  value: string;
}) {
  const toneClass = {
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
  }[tone];

  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </div>
    </div>
  );
}
