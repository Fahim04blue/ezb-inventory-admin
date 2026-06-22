import {
  CreditCard,
  Megaphone,
  Package2,
  PieChart,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { formatCurrency } from "@/lib/formatters";

type ExpenseSummaryCardsProps = {
  totals: {
    totalExpenses: number;
    productPurchases: number;
    marketingAndPr: number;
    courierAndPackaging: number;
    otherCosts: number;
  };
  sparklineSeries: {
    totalExpenses: number[];
    productPurchases: number[];
    marketingAndPr: number[];
    courierAndPackaging: number[];
    otherCosts: number[];
  };
};

type SummaryCardConfig = {
  key: keyof ExpenseSummaryCardsProps["totals"];
  label: string;
  icon: LucideIcon;
  iconClasses: string;
  lineColor: string;
};

const CARD_CONFIGS: SummaryCardConfig[] = [
  {
    key: "totalExpenses",
    label: "Total Expenses",
    icon: CreditCard,
    iconClasses: "bg-emerald-50 text-emerald-700",
    lineColor: "#16a34a",
  },
  {
    key: "productPurchases",
    label: "Product Purchases",
    icon: ShoppingBag,
    iconClasses: "bg-lime-50 text-lime-700",
    lineColor: "#10b981",
  },
  {
    key: "marketingAndPr",
    label: "Marketing & PR",
    icon: Megaphone,
    iconClasses: "bg-blue-50 text-blue-700",
    lineColor: "#2563eb",
  },
  {
    key: "courierAndPackaging",
    label: "Courier & Packaging",
    icon: Package2,
    iconClasses: "bg-violet-50 text-violet-700",
    lineColor: "#8b5cf6",
  },
  {
    key: "otherCosts",
    label: "Other Costs",
    icon: PieChart,
    iconClasses: "bg-orange-50 text-orange-700",
    lineColor: "#f97316",
  },
];

function buildSparklinePath(values: number[]) {
  const width = 140;
  const height = 36;

  if (values.length === 0 || values.every((value) => value === 0)) {
    return `M 0 ${height / 2} L ${width} ${height / 2}`;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export function ExpenseSummaryCards({
  totals,
  sparklineSeries,
}: ExpenseSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {CARD_CONFIGS.map((card) => {
        const Icon = card.icon;
        const series = sparklineSeries[card.key];

        return (
          <div
            key={card.key}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${card.iconClasses}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-600">
                  {card.label}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950 xl:text-[1.15rem]">
                  {formatCurrency(totals[card.key])}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <svg
                aria-hidden="true"
                className="h-8 w-full"
                viewBox="0 0 140 36"
                preserveAspectRatio="none"
              >
                <path
                  d={buildSparklinePath(series)}
                  fill="none"
                  stroke={card.lineColor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.25"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
