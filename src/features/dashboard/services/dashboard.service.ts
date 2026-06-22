import {
  OrderStatus,
  OrderType,
  PaymentStatus,
  Prisma,
  PurchaseStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getReportsOverview,
  isOperatingExpenseCategory,
  isRealizedOrder,
} from "@/features/reports/services/report.service";
import type {
  DashboardActivityItem,
  DashboardOverview,
  DashboardPurchaseItem,
} from "../types/dashboard.types";

const ZERO = new Prisma.Decimal(0);

function money(value: Prisma.Decimal) {
  return value.toFixed(4);
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function purchaseView(purchase: {
  id: number;
  referenceNumber: string;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  totalLandedCostBdt: Prisma.Decimal;
  purchaseDate: Date;
  supplier: { name: string } | null;
  items: Array<{ quantity: number; receivedQuantity: number }>;
}): DashboardPurchaseItem {
  return {
    id: purchase.id,
    referenceNumber: purchase.referenceNumber,
    supplierName: purchase.supplier?.name ?? null,
    status: purchase.status,
    paymentStatus: purchase.paymentStatus,
    totalQuantity: purchase.items.reduce((sum, item) => sum + item.quantity, 0),
    receivedQuantity: purchase.items.reduce((sum, item) => sum + item.receivedQuantity, 0),
    totalLandedCostBdt: money(purchase.totalLandedCostBdt),
    paidAmountBdt: null,
    purchaseDate: purchase.purchaseDate.toISOString(),
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = new Date();
  const chartStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  const [todayReport, monthReport, orders, purchases, expenses, salesSummaries, variants, movements] =
    await Promise.all([
      getReportsOverview({ dateRange: "today" }),
      getReportsOverview({ dateRange: "this_month" }),
      prisma.order.findMany({
        where: { isActive: true },
        orderBy: { orderDate: "desc" },
        select: {
          id: true,
          orderNumber: true,
          orderType: true,
          status: true,
          paymentStatus: true,
          customerName: true,
          customerPhone: true,
          amountReceived: true,
          dueAmount: true,
          orderDate: true,
        },
      }),
      prisma.purchase.findMany({
        where: { status: { not: PurchaseStatus.CANCELLED } },
        orderBy: { purchaseDate: "desc" },
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          paymentStatus: true,
          totalLandedCostBdt: true,
          purchaseDate: true,
          supplier: { select: { name: true } },
          items: { select: { quantity: true, receivedQuantity: true } },
        },
      }),
      prisma.expense.findMany({
        where: { isActive: true },
        orderBy: { date: "desc" },
        select: { id: true, title: true, category: true, amountBdt: true, date: true },
      }),
      prisma.salesSummary.findMany({
        where: { isActive: true, date: { gte: chartStart } },
        select: { amountBdt: true, date: true },
      }),
      prisma.productVariant.findMany({
        where: { isActive: true, lowStockAlert: { not: null } },
        select: {
          id: true,
          name: true,
          sku: true,
          currentStock: true,
          lowStockAlert: true,
          isPriority: true,
          priorityNote: true,
          product: { select: { name: true } },
        },
      }),
      prisma.stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          direction: true,
          quantity: true,
          createdAt: true,
          productVariant: {
            select: { name: true, product: { select: { name: true } } },
          },
        },
      }),
    ]);

  const orderView = (order: (typeof orders)[number]) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    status: order.status,
    paymentStatus: order.paymentStatus,
    amountReceived: money(order.amountReceived),
    dueAmount: money(order.dueAmount),
    orderDate: order.orderDate.toISOString(),
  });

  const ordersNeedingAction = orders
    .filter((order) => {
      const ready = order.status === OrderStatus.READY_TO_DELIVER;
      const confirmedNormal =
        order.orderType === OrderType.NORMAL && order.status === OrderStatus.CONFIRMED;
      const paymentDue =
        (order.paymentStatus === PaymentStatus.UNPAID ||
          order.paymentStatus === PaymentStatus.PARTIAL) &&
        (order.status === OrderStatus.DELIVERED || ready);
      return ready || confirmedNormal || paymentDue;
    })
    .slice(0, 5)
    .map(orderView);

  const waitingPreOrders = orders.filter(
    (order) =>
      order.orderType === OrderType.PRE_ORDER && order.status === OrderStatus.PRE_ORDERED,
  );
  const readyPreOrders = orders.filter(
    (order) =>
      order.orderType === OrderType.PRE_ORDER &&
      order.status === OrderStatus.READY_TO_DELIVER,
  );
  const activePreOrderDue = waitingPreOrders.reduce(
    (sum, order) => sum.add(order.dueAmount),
    ZERO,
  );

  const lowStockItems = variants
    .filter(
      (variant): variant is typeof variant & { lowStockAlert: number } =>
        variant.lowStockAlert !== null && variant.currentStock <= variant.lowStockAlert,
    )
    .sort((a, b) => Number(b.isPriority) - Number(a.isPriority) || a.currentStock - b.currentStock);
  const lowStock = lowStockItems
    .slice(0, 6)
    .map((variant) => ({
      id: variant.id,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku,
      currentStock: variant.currentStock,
      lowStockAlert: variant.lowStockAlert,
      isPriority: variant.isPriority,
      priorityNote: variant.priorityNote,
    }));

  const incomingPurchaseRecords = purchases
    .filter(
      (purchase) =>
        purchase.status === PurchaseStatus.ORDERED ||
        purchase.status === PurchaseStatus.IN_CARGO ||
        purchase.status === PurchaseStatus.PARTIALLY_RECEIVED,
    );
  const supplierPaymentRecords = purchases
    .filter(
      (purchase) =>
        purchase.paymentStatus === PaymentStatus.UNPAID ||
        purchase.paymentStatus === PaymentStatus.PARTIAL,
    );
  const incomingPurchases = incomingPurchaseRecords.slice(0, 4).map(purchaseView);
  const supplierPaymentAttention = supplierPaymentRecords.slice(0, 4).map(purchaseView);

  const chartMap = new Map<string, { sales: Prisma.Decimal; expenses: Prisma.Decimal }>();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    chartMap.set(dayKey(date), { sales: ZERO, expenses: ZERO });
  }
  orders
    .filter((order) => order.orderDate >= chartStart && isRealizedOrder(order))
    .forEach((order) => {
      const point = chartMap.get(dayKey(order.orderDate));
      if (point) point.sales = point.sales.add(order.amountReceived);
    });
  salesSummaries.forEach((summary) => {
    const point = chartMap.get(dayKey(summary.date));
    if (point) point.sales = point.sales.add(summary.amountBdt);
  });
  expenses
    .filter((expense) => expense.date >= chartStart && isOperatingExpenseCategory(expense.category))
    .forEach((expense) => {
      const point = chartMap.get(dayKey(expense.date));
      if (point) point.expenses = point.expenses.add(expense.amountBdt);
    });

  const activities: DashboardActivityItem[] = [
    ...orders.slice(0, 10).map((order) => ({
      id: `order-${order.id}`,
      type: "ORDER" as const,
      title: order.orderNumber,
      description: `${order.customerName ?? "Walk-in customer"} · ${order.status.replaceAll("_", " ")}`,
      amount: money(order.amountReceived),
      occurredAt: order.orderDate.toISOString(),
      href: "/sales/orders",
    })),
    ...expenses.slice(0, 10).map((expense) => ({
      id: `expense-${expense.id}`,
      type: "EXPENSE" as const,
      title: expense.title,
      description: expense.category.replaceAll("_", " "),
      amount: money(expense.amountBdt),
      occurredAt: expense.date.toISOString(),
      href: "/finance/expenses",
    })),
    ...purchases.slice(0, 10).map((purchase) => ({
      id: `purchase-${purchase.id}`,
      type: "PURCHASE" as const,
      title: purchase.referenceNumber,
      description: `${purchase.supplier?.name ?? "No supplier"} · ${purchase.status.replaceAll("_", " ")}`,
      amount: money(purchase.totalLandedCostBdt),
      occurredAt: purchase.purchaseDate.toISOString(),
      href: "/purchasing/purchases",
    })),
    ...movements.map((movement) => ({
      id: `stock-${movement.id}`,
      type: "STOCK" as const,
      title: `${movement.productVariant.product.name} · ${movement.productVariant.name}`,
      description: `${movement.type.replaceAll("_", " ")} · ${movement.quantity} units`,
      amount: null,
      occurredAt: movement.createdAt.toISOString(),
      href: "/inventory/stock",
      movementType: movement.type,
      movementDirection: movement.direction,
    })),
  ];

  return {
    generatedAt: now.toISOString(),
    summary: {
      todaySalesReceived: todayReport.summary.salesReceived,
      monthSalesReceived: monthReport.summary.salesReceived,
      monthNetProfit: monthReport.summary.netProfit,
      currentStockValue: monthReport.summary.currentStockValue,
      activePreOrders: waitingPreOrders.length,
      lowStockItems: lowStockItems.length,
    },
    focus: {
      readyToDeliver: readyPreOrders.length,
      waitingPreOrders: waitingPreOrders.length,
      lowStockItems: lowStockItems.length,
      supplierPayments: supplierPaymentRecords.length,
      incomingPurchases: incomingPurchaseRecords.length,
    },
    ordersNeedingAction,
    preOrders: {
      readyToDeliverCount: readyPreOrders.length,
      waitingForStockCount: waitingPreOrders.length,
      activeDue: money(activePreOrderDue),
      items: waitingPreOrders.slice(0, 5).map((order) => ({
        ...orderView(order),
        customerPhone: order.customerPhone,
      })),
    },
    lowStock,
    incomingPurchases,
    supplierPaymentAttention,
    recentActivity: activities
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 6),
    chart: Array.from(chartMap.entries()).map(([key, value]) => ({
      key,
      label: new Intl.DateTimeFormat("en-BD", { weekday: "short" }).format(
        new Date(`${key}T00:00:00`),
      ),
      sales: money(value.sales),
      expenses: money(value.expenses),
    })),
  };
}
