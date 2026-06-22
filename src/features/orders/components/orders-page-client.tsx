"use client";

import { OrderStatus, OrderType } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatDate, formatEnum } from "@/lib/formatters";
import type { CreateOrderInput, FulfillPreOrderInput } from "../schemas/order.schema";
import type {
  OrderFilters,
  OrdersPageData,
  OrderView,
  PreOrderPurchaseItemOption,
} from "../types/order.types";
import { OrderFormDrawer } from "./order-form-drawer";
import { FulfillPreOrderDrawer } from "./fulfill-preorder-drawer";
import { OrdersMobileView } from "./orders-mobile-view";
import { OrdersFilterBar } from "./orders-filter-bar";
import { OrdersPageHeader } from "./orders-page-header";
import { OrdersPagination } from "./orders-pagination";
import { OrdersSummaryCards } from "./orders-summary-cards";
import { OrdersTable } from "./orders-table";
import { PreOrderAvailabilityTab } from "./pre-order-availability-tab";

type ActiveOrdersTab = "ORDERS" | "PRE_ORDER_AVAILABILITY";

const DEFAULT_FILTERS: OrderFilters = {
  orderType: "ALL",
  status: "ALL",
  paymentStatus: "ALL",
  source: "ALL",
  date: "ALL",
  search: "",
};

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function matchesDateFilter(value: string, filter: OrderFilters["date"]) {
  if (filter === "ALL") {
    return true;
  }

  const orderDate = new Date(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (filter === "TODAY") {
    return isSameDay(orderDate, startOfToday);
  }

  if (filter === "THIS_WEEK") {
    const day = startOfToday.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - diff);
    return orderDate >= startOfWeek;
  }

  if (filter === "THIS_MONTH") {
    return (
      orderDate.getFullYear() === startOfToday.getFullYear() &&
      orderDate.getMonth() === startOfToday.getMonth()
    );
  }

  return true;
}

function OrdersLoadingState() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <TableSkeleton columns={11} rows={6} />
    </div>
  );
}

function getOrderDisplayPriority(order: OrderView) {
  if (order.status === OrderStatus.READY_TO_DELIVER) {
    return 0;
  }

  if (order.orderType === OrderType.NORMAL && order.status !== OrderStatus.DELIVERED) {
    return 1;
  }

  if (order.orderType === OrderType.PRE_ORDER) {
    return 2;
  }

  return 3;
}

export function OrdersPageClient() {
  const [data, setData] = useState<OrdersPageData>({
    orders: [],
    variantOptions: [],
    preOrderPurchaseItems: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderView | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderView | null>(null);
  const [fulfillingOrder, setFulfillingOrder] = useState<OrderView | null>(null);
  const [initialPurchaseItemId, setInitialPurchaseItemId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveOrdersTab>("ORDERS");
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const pageData = await apiClient<OrdersPageData>("/api/orders", {
        cache: "no-store",
        showErrorToast: false,
      });

      setData(pageData);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialOrders() {
      try {
        const pageData = await apiClient<OrdersPageData>("/api/orders", {
          cache: "no-store",
          showErrorToast: false,
        });

        if (!isCancelled) {
          setData(pageData);
        }
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialOrders();

    return () => {
      isCancelled = true;
    };
  }, []);

  function handleFilterChange<K extends keyof OrderFilters>(
    key: K,
    value: OrderFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }

  function handleRowsPerPageChange(value: number) {
    setRowsPerPage(value);
    setCurrentPage(1);
  }

  function handleOpenCreateOrder() {
    setInitialPurchaseItemId(null);
    setEditingOrder(null);
    setIsDrawerOpen(true);
  }

  function handleOpenEditOrder(order: OrderView) {
    setInitialPurchaseItemId(null);
    setSelectedOrder(null);
    setFulfillingOrder(null);
    setEditingOrder(order);
    setIsDrawerOpen(true);
  }

  function handleCreatePreOrderFromBatch(batch: PreOrderPurchaseItemOption) {
    setSelectedOrder(null);
    setEditingOrder(null);
    setInitialPurchaseItemId(batch.id);
    setIsDrawerOpen(true);
  }

  function handleCloseOrderForm() {
    setIsDrawerOpen(false);
    setEditingOrder(null);
    setInitialPurchaseItemId(null);
  }

  function handleOpenFulfillPreOrder(order: OrderView) {
    setSelectedOrder(null);
    setIsDrawerOpen(false);
    setEditingOrder(null);
    setInitialPurchaseItemId(null);
    setFulfillingOrder(order);
  }

  function handleCloseFulfillPreOrder() {
    setFulfillingOrder(null);
  }

  async function handleSubmitOrder(input: CreateOrderInput) {
    setIsSubmitting(true);

    try {
      await apiClient<{ order: OrderView }>(
        editingOrder ? `/api/orders/${editingOrder.id}` : "/api/orders",
        {
          method: editingOrder ? "PATCH" : "POST",
          body: JSON.stringify(input),
          showSuccessToast: true,
        },
      );
      handleCloseOrderForm();
      await loadData(true);
    } catch (error) {
      console.error("Failed to save order:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateStatus(order: OrderView, status: OrderStatus) {
    setIsMutating(true);

    try {
      await apiClient<{ order: OrderView }>(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        showSuccessToast: true,
      });
      await loadData(true);
    } catch (error) {
      console.error("Failed to update order status:", error);
    } finally {
      setIsMutating(false);
    }
  }

  async function handleFulfillPreOrder(order: OrderView, input: FulfillPreOrderInput) {
    setIsMutating(true);

    try {
      await apiClient<{ order: OrderView }>(
        `/api/orders/${order.id}/fulfill-preorder`,
        {
          method: "POST",
          body: JSON.stringify(input),
          showSuccessToast: true,
        },
      );
      handleCloseFulfillPreOrder();
      await loadData(true);
    } catch (error) {
      console.error("Failed to fulfill pre-order:", error);
    } finally {
      setIsMutating(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return data.orders.filter((order) => {
      const matchesType =
        filters.orderType === "ALL" || order.orderType === filters.orderType;
      const matchesStatus =
        filters.status === "ALL" || order.status === filters.status;
      const matchesPayment =
        filters.paymentStatus === "ALL" ||
        order.paymentStatus === filters.paymentStatus;
      const matchesSource = filters.source === "ALL" || order.source === filters.source;
      const matchesDate = matchesDateFilter(order.orderDate, filters.date);
      const matchesSearch =
        !search ||
        [
          order.orderNumber,
          order.customerName,
          order.customerPhone,
          order.customerAddress,
          order.notes,
          ...order.items.flatMap((item) => [
            item.productName,
            item.variantName,
            item.sku,
          ]),
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(search));

      return (
        matchesType &&
        matchesStatus &&
        matchesPayment &&
        matchesSource &&
        matchesDate &&
        matchesSearch
      );
    });
  }, [data.orders, filters]);

  const sortedOrders = useMemo(
    () =>
      [...filteredOrders].sort((first, second) => {
        const priorityDifference =
          getOrderDisplayPriority(first) - getOrderDisplayPriority(second);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return (
          new Date(second.orderDate).getTime() - new Date(first.orderDate).getTime()
        );
      }),
    [filteredOrders],
  );

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + rowsPerPage);
  const startItem = sortedOrders.length ? startIndex + 1 : 0;
  const endItem = Math.min(startIndex + rowsPerPage, sortedOrders.length);

  return (
    <div className="min-w-0 md:bg-[#f6f1e5] md:px-6 md:py-5 lg:px-8">
      <OrdersMobileView
        activeTab={activeTab}
        currentPage={safeCurrentPage}
        filteredOrders={filteredOrders}
        filters={filters}
        isLoading={isLoading}
        isMutating={isMutating}
        onAddOrder={handleOpenCreateOrder}
        onCancelOrder={(order) => void handleUpdateStatus(order, OrderStatus.CANCELLED)}
        onClearFilters={handleClearFilters}
        onCreatePreOrder={handleCreatePreOrderFromBatch}
        onDeliverOrder={(order) => void handleUpdateStatus(order, OrderStatus.DELIVERED)}
        onEditOrder={handleOpenEditOrder}
        onFilterChange={handleFilterChange}
        onFulfillOrder={handleOpenFulfillPreOrder}
        onPageChange={setCurrentPage}
        onTabChange={setActiveTab}
        onViewOrder={setSelectedOrder}
        orders={paginatedOrders}
        preOrderPurchaseItems={data.preOrderPurchaseItems}
        totalItems={sortedOrders.length}
        totalPages={totalPages}
      />

      <div className="mx-auto hidden max-w-[1560px] flex-col gap-4 md:flex">
        <OrdersPageHeader
          isRefreshing={isRefreshing}
          onAddOrder={handleOpenCreateOrder}
          onRefresh={() => void loadData(true)}
        />

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-[0_8px_22px_rgba(15,23,42,0.055)] sm:w-fit">
          <button
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "ORDERS"
                ? "bg-emerald-800 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("ORDERS")}
            type="button"
          >
            Orders
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "PRE_ORDER_AVAILABILITY"
                ? "bg-emerald-800 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("PRE_ORDER_AVAILABILITY")}
            type="button"
          >
            Pre-order Availability
          </button>
        </div>

        {activeTab === "ORDERS" ? (
          <>
            <OrdersSummaryCards orders={filteredOrders} />

            <OrdersFilterBar
              filters={filters}
              onClearFilters={handleClearFilters}
              onFilterChange={handleFilterChange}
            />

            {isLoading ? (
              <OrdersLoadingState />
            ) : paginatedOrders.length ? (
              <div className="overflow-hidden rounded-2xl bg-white">
                <OrdersTable
                  isMutating={isMutating}
                  onCancelOrder={(order) => void handleUpdateStatus(order, OrderStatus.CANCELLED)}
                  onEditOrder={handleOpenEditOrder}
                  onFulfillPreOrder={handleOpenFulfillPreOrder}
                  onMarkDelivered={(order) => void handleUpdateStatus(order, OrderStatus.DELIVERED)}
                  onViewOrder={setSelectedOrder}
                  orders={paginatedOrders}
                />
                <OrdersPagination
                  currentPage={safeCurrentPage}
                  endItem={endItem}
                  onPageChange={setCurrentPage}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  rowsPerPage={rowsPerPage}
                  startItem={startItem}
                  totalItems={sortedOrders.length}
                  totalPages={totalPages}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-10 text-center shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
                <h2 className="text-base font-semibold text-slate-950">No orders found</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Create an order or clear filters to see existing entries.
                </p>
              </div>
            )}
          </>
        ) : (
          <PreOrderAvailabilityTab
            batches={data.preOrderPurchaseItems}
            onCreatePreOrder={handleCreatePreOrderFromBatch}
          />
        )}
      </div>

      <OrderFormDrawer
        isSubmitting={isSubmitting}
        onClose={handleCloseOrderForm}
        onSubmit={handleSubmitOrder}
        open={isDrawerOpen}
        order={editingOrder}
        initialPurchaseItemId={initialPurchaseItemId}
        preOrderPurchaseItems={data.preOrderPurchaseItems}
        variantOptions={data.variantOptions}
      />

      <FulfillPreOrderDrawer
        key={fulfillingOrder?.id ?? "fulfill-preorder-empty"}
        isSubmitting={isMutating}
        onClose={handleCloseFulfillPreOrder}
        onSubmit={handleFulfillPreOrder}
        order={fulfillingOrder}
      />

      <CrudDrawer
        onClose={() => setSelectedOrder(null)}
        open={Boolean(selectedOrder)}
        title={selectedOrder?.orderNumber ?? "Order details"}
      >
        {selectedOrder ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-slate-200 bg-slate-50 text-slate-700">
                  {formatEnum(selectedOrder.orderType)}
                </Badge>
                <Badge className="border border-slate-200 bg-slate-50 text-slate-700">
                  {formatEnum(selectedOrder.status)}
                </Badge>
                <Badge className="border border-slate-200 bg-slate-50 text-slate-700">
                  {formatEnum(selectedOrder.paymentStatus)}
                </Badge>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Date</dt>
                  <dd className="font-medium text-slate-950">
                    {formatDate(selectedOrder.orderDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Source</dt>
                  <dd className="font-medium text-slate-950">
                    {formatEnum(selectedOrder.source)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Customer</dt>
                  <dd className="font-medium text-slate-950">
                    {selectedOrder.customerName || "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Phone</dt>
                  <dd className="font-medium text-slate-950">
                    {selectedOrder.customerPhone || "-"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-950">Items</h3>
              <div className="mt-3 divide-y divide-slate-100">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">
                          {item.productName} - {item.variantName}
                        </p>
                        <p className="text-xs text-slate-500">
                          Qty {item.quantity} x {formatCurrency(item.unitSellingPrice)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Cost {formatCurrency(item.unitCost)} each
                        </p>
                        {selectedOrder.orderType === OrderType.PRE_ORDER &&
                        item.purchaseRef ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {item.purchaseRef}
                            {item.purchaseSupplierName
                              ? ` / ${item.purchaseSupplierName}`
                              : ""}
                            {item.purchaseCountry ? ` / ${item.purchaseCountry}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-950">
                          {formatCurrency(item.totalSellingPrice)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Product cost {formatCurrency(item.totalCost)}
                        </p>
                        <p
                          className={
                            Number(item.profit) < 0
                              ? "text-xs font-medium text-rose-600"
                              : "text-xs font-medium text-emerald-700"
                          }
                        >
                          Profit {formatCurrency(item.profit)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Product Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-slate-600">Discount</span>
                <span>{formatCurrency(selectedOrder.discountAmount)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold text-slate-950">
                <span>Customer Payable</span>
                <span>{formatCurrency(selectedOrder.customerPayable)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-slate-600">Delivery Charge</span>
                <span>{formatCurrency(selectedOrder.deliveryCharge)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-slate-600">COD/Courier Fee</span>
                <span>{formatCurrency(selectedOrder.courierDeduction)}</span>
              </div>
              <div className="mt-2 flex justify-between text-slate-600">
                <span>
                  {selectedOrder.orderType === OrderType.PRE_ORDER
                    ? "Advance Received"
                    : "Amount Received"}
                </span>
                <span>{formatCurrency(selectedOrder.amountReceived)}</span>
              </div>
              <div className="mt-2 flex justify-between text-slate-600">
                <span>Product Cost</span>
                <span>{formatCurrency(selectedOrder.productCost)}</span>
              </div>
              <div className="mt-2 flex justify-between text-slate-600">
                <span>
                  {selectedOrder.orderType === OrderType.PRE_ORDER
                    ? "Expected Profit"
                    : "Gross Profit"}
                </span>
                <span>{formatCurrency(selectedOrder.grossProfit)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold">
                <span>
                  {selectedOrder.orderType === OrderType.PRE_ORDER
                    ? "Expected Profit"
                    : "Net Profit"}
                </span>
                <span
                  className={
                    Number(selectedOrder.netProfit) < 0
                      ? "text-rose-600"
                      : "text-emerald-700"
                  }
                >
                  {formatCurrency(selectedOrder.netProfit)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </CrudDrawer>
    </div>
  );
}
