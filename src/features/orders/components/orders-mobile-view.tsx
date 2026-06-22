"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  CompletedQuickFilter,
  OrderFilters,
  OrdersMainTab,
  OrderView,
  PreOrderPurchaseItemOption,
  PreOrderQuickFilter,
  PreOrderView,
} from "../types/order.types";
import { OrderMobileCard } from "./order-mobile-card";
import { OrdersMobileFilters } from "./orders-mobile-filters";
import { OrdersMobileSummary } from "./orders-mobile-summary";
import { PreOrderAvailabilityTab } from "./pre-order-availability-tab";
import { OrdersViewControls } from "./orders-view-controls";

type Props = {
  activeTab: OrdersMainTab;
  tabCounts: Record<OrdersMainTab, number>;
  preOrderView: PreOrderView;
  preOrderQuickFilter: PreOrderQuickFilter;
  completedQuickFilter: CompletedQuickFilter;
  filters: OrderFilters;
  filteredOrders: OrderView[];
  orders: OrderView[];
  preOrderPurchaseItems: PreOrderPurchaseItemOption[];
  isLoading: boolean;
  isMutating: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onTabChange: (tab: OrdersMainTab) => void;
  onPreOrderViewChange: (view: PreOrderView) => void;
  onPreOrderQuickFilterChange: (filter: PreOrderQuickFilter) => void;
  onCompletedQuickFilterChange: (filter: CompletedQuickFilter) => void;
  onAddOrder: () => void;
  onFilterChange: <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onViewOrder: (order: OrderView) => void;
  onEditOrder: (order: OrderView) => void;
  onDeliverOrder: (order: OrderView) => void;
  onCancelOrder: (order: OrderView) => void;
  onFulfillOrder: (order: OrderView) => void;
  onCreatePreOrder: (batch: PreOrderPurchaseItemOption) => void;
};

export function OrdersMobileView(props: Props) {
  const { activeTab, filters, filteredOrders, orders, preOrderPurchaseItems } = props;

  return (
    <div className="space-y-4 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight text-slate-950">Orders</h1><p className="mt-1 text-sm text-slate-600">Create and manage normal orders and pre-orders.</p></div>
        <Button className="h-10 w-auto shrink-0 rounded-xl bg-emerald-800 px-3.5 text-white" onClick={props.onAddOrder}><Plus className="mr-1.5 h-4 w-4" />Add Order</Button>
      </div>

      <OrdersViewControls
        activeTab={activeTab}
        completedQuickFilter={props.completedQuickFilter}
        counts={props.tabCounts}
        onCompletedQuickFilterChange={props.onCompletedQuickFilterChange}
        onPreOrderQuickFilterChange={props.onPreOrderQuickFilterChange}
        onPreOrderViewChange={props.onPreOrderViewChange}
        onTabChange={props.onTabChange}
        preOrderQuickFilter={props.preOrderQuickFilter}
        preOrderView={props.preOrderView}
      />

      {activeTab !== "PRE_ORDERS" || props.preOrderView === "CUSTOMERS" ? (
        <>
          <OrdersMobileSummary orders={filteredOrders} />
          <OrdersMobileFilters filters={filters} onClearFilters={props.onClearFilters} onFilterChange={props.onFilterChange} />

          {props.isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div className="h-44 animate-pulse rounded-3xl bg-white" key={index} />)}</div>
          ) : orders.length ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderMobileCard
                  isMutating={props.isMutating}
                  key={order.id}
                  onCancel={props.onCancelOrder}
                  onDeliver={props.onDeliverOrder}
                  onEdit={props.onEditOrder}
                  onFulfill={props.onFulfillOrder}
                  onView={props.onViewOrder}
                  order={order}
                  view={activeTab}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200/80 bg-white px-5 py-8 text-center shadow-sm"><h2 className="font-semibold text-slate-950">{activeTab === "ACTIVE" ? "No active orders found" : activeTab === "PRE_ORDERS" ? "No pre-orders found" : "No completed orders found"}</h2><p className="mt-1 text-xs text-slate-500">Create an order or clear filters.</p></div>
          )}

          {props.totalPages > 1 ? (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2.5 text-xs text-slate-500">
              <span>{props.totalItems} orders · Page {props.currentPage} of {props.totalPages}</span>
              <div className="flex gap-1.5"><Button aria-label="Previous page" className="h-8 w-8 px-0" disabled={props.currentPage <= 1} onClick={() => props.onPageChange(props.currentPage - 1)} variant="outline"><ChevronLeft className="h-4 w-4" /></Button><Button aria-label="Next page" className="h-8 w-8 px-0" disabled={props.currentPage >= props.totalPages} onClick={() => props.onPageChange(props.currentPage + 1)} variant="outline"><ChevronRight className="h-4 w-4" /></Button></div>
            </div>
          ) : null}
        </>
      ) : (
        <PreOrderAvailabilityTab batches={preOrderPurchaseItems} onCreatePreOrder={props.onCreatePreOrder} />
      )}
    </div>
  );
}
