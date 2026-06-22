"use client";

import { cn } from "@/lib/utils";
import type {
  CompletedQuickFilter,
  OrdersMainTab,
  PreOrderQuickFilter,
  PreOrderView,
} from "../types/order.types";

type Props = {
  activeTab: OrdersMainTab;
  counts: Record<OrdersMainTab, number>;
  preOrderView: PreOrderView;
  preOrderQuickFilter: PreOrderQuickFilter;
  completedQuickFilter: CompletedQuickFilter;
  onTabChange: (tab: OrdersMainTab) => void;
  onPreOrderViewChange: (view: PreOrderView) => void;
  onPreOrderQuickFilterChange: (filter: PreOrderQuickFilter) => void;
  onCompletedQuickFilterChange: (filter: CompletedQuickFilter) => void;
};

const MAIN_TABS: Array<{ value: OrdersMainTab; label: string }> = [
  { value: "ACTIVE", label: "Active Orders" },
  { value: "PRE_ORDERS", label: "Pre-orders" },
  { value: "COMPLETED", label: "Completed" },
];

const PRE_ORDER_FILTERS: Array<{ value: PreOrderQuickFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "WAITING", label: "Waiting" },
  { value: "PARTIAL", label: "Partial" },
  { value: "READY", label: "Ready" },
  { value: "PAYMENT_DUE", label: "Payment Due" },
];

const COMPLETED_FILTERS: Array<{ value: CompletedQuickFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
];

function SegmentedButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition",
        active
          ? "bg-emerald-800 text-white"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-emerald-700 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function OrdersViewControls(props: Props) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-1">
          {MAIN_TABS.map((tab) => (
            <SegmentedButton
              active={props.activeTab === tab.value}
              key={tab.value}
              onClick={() => props.onTabChange(tab.value)}
            >
              {tab.label} <span className="ml-1 opacity-80">{props.counts[tab.value]}</span>
            </SegmentedButton>
          ))}
        </div>
      </div>

      {props.activeTab === "PRE_ORDERS" ? (
        <div className="space-y-2">
          <div className="flex w-fit rounded-xl border border-slate-200 bg-white p-1">
            <SegmentedButton
              active={props.preOrderView === "CUSTOMERS"}
              onClick={() => props.onPreOrderViewChange("CUSTOMERS")}
            >
              Customers
            </SegmentedButton>
            <SegmentedButton
              active={props.preOrderView === "AVAILABILITY"}
              onClick={() => props.onPreOrderViewChange("AVAILABILITY")}
            >
              Availability
            </SegmentedButton>
          </div>
          {props.preOrderView === "CUSTOMERS" ? (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PRE_ORDER_FILTERS.map((filter) => (
                <Chip
                  active={props.preOrderQuickFilter === filter.value}
                  key={filter.value}
                  onClick={() => props.onPreOrderQuickFilterChange(filter.value)}
                >
                  {filter.label}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {props.activeTab === "COMPLETED" ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {COMPLETED_FILTERS.map((filter) => (
            <Chip
              active={props.completedQuickFilter === filter.value}
              key={filter.value}
              onClick={() => props.onCompletedQuickFilterChange(filter.value)}
            >
              {filter.label}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
