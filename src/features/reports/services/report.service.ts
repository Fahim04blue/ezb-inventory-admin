import {
  ExpenseCategory,
  OrderSource,
  OrderStatus,
  OrderType,
  Prisma,
  PurchaseStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  ReportDateRange,
  ReportsOverview,
  TopProductReport,
} from "../types/report.types";

export class ReportServiceError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "ReportServiceError";
  }
}

export type ReportQuery = {
  dateRange: ReportDateRange;
  from?: string;
  to?: string;
};

const ZERO = new Prisma.Decimal(0);
const ACQUISITION_EXPENSES = new Set<ExpenseCategory>([
  ExpenseCategory.PRODUCT_PURCHASE,
  ExpenseCategory.CARGO_WEIGHT_CHARGE,
]);

const EXPENSE_GROUPS: Array<{
  key: string;
  label: string;
  categories: ExpenseCategory[];
}> = [
  {
    key: "marketing_ads",
    label: "Marketing / Ads",
    categories: [
      ExpenseCategory.FACEBOOK_BOOST,
      ExpenseCategory.INSTAGRAM_BOOST,
      ExpenseCategory.META_ADS,
    ],
  },
  {
    key: "courier_packaging",
    label: "Courier / Packaging",
    categories: [ExpenseCategory.COURIER, ExpenseCategory.PACKAGING],
  },
  {
    key: "pr_giveaway",
    label: "PR / Giveaway",
    categories: [ExpenseCategory.PR_PROMOTION, ExpenseCategory.GIVEAWAY],
  },
  {
    key: "transport",
    label: "Transport",
    categories: [ExpenseCategory.TRANSPORT],
  },
  {
    key: "payment_refund",
    label: "Payment / Refund",
    categories: [ExpenseCategory.PAYMENT_CHARGE, ExpenseCategory.REFUND],
  },
  {
    key: "tools",
    label: "Tools",
    categories: [ExpenseCategory.TOOLS_SUBSCRIPTION],
  },
  {
    key: "other",
    label: "Other",
    categories: [ExpenseCategory.DAMAGE_LOSS, ExpenseCategory.OTHER],
  },
];

function money(value: Prisma.Decimal) {
  return value.toFixed(4);
}

function sumDecimals(values: Prisma.Decimal[]) {
  return values.reduce((total, value) => total.add(value), ZERO);
}

function zeroIfNegative(value: Prisma.Decimal) {
  return value.isNegative() ? ZERO : value;
}

function withLegacyFallback(primary: Prisma.Decimal, fallback: Prisma.Decimal) {
  return primary.isZero() && !fallback.isZero() ? fallback : primary;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function parseDateOnly(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ReportServiceError(`${field} must use YYYY-MM-DD format.`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new ReportServiceError(`${field} is not a valid date.`);
  }
  return date;
}

function getPeriod(query: ReportQuery) {
  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = null;
  let label = "All Time";

  if (query.dateRange === "today") {
    from = startOfDay(now);
    to = endOfDay(now);
    label = "Today";
  } else if (query.dateRange === "this_month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = endOfDay(now);
    label = "This Month";
  } else if (query.dateRange === "last_month") {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    label = "Last Month";
  } else if (query.dateRange === "last_30_days") {
    from = startOfDay(now);
    from.setDate(from.getDate() - 29);
    to = endOfDay(now);
    label = "Last 30 Days";
  } else if (query.dateRange === "custom") {
    if (!query.from || !query.to) {
      throw new ReportServiceError("From and to dates are required for a custom range.");
    }
    from = startOfDay(parseDateOnly(query.from, "From date"));
    to = endOfDay(parseDateOnly(query.to, "To date"));
    if (from > to) {
      throw new ReportServiceError("From date cannot be after to date.");
    }
    label = `${query.from} to ${query.to}`;
  }

  return { from, to, label };
}

function dateWhere(from: Date | null, to: Date | null) {
  return from && to ? { gte: from, lte: to } : undefined;
}

export function isRealizedOrder(order: { orderType: OrderType; status: OrderStatus }) {
  if (order.orderType === OrderType.PRE_ORDER) {
    return (
      order.status === OrderStatus.READY_TO_DELIVER ||
      order.status === OrderStatus.DELIVERED
    );
  }
  return order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.RETURNED;
}

export function isOperatingExpenseCategory(category: ExpenseCategory) {
  return !ACQUISITION_EXPENSES.has(category);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function topProductView(item: {
  productVariantId: number;
  name: string;
  sku: string | null;
  quantity: number;
  revenue: Prisma.Decimal;
  profit: Prisma.Decimal;
}): TopProductReport {
  return {
    productVariantId: item.productVariantId,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    revenue: money(item.revenue),
    profit: money(item.profit),
  };
}

export async function getReportsOverview(query: ReportQuery): Promise<ReportsOverview> {
  const period = getPeriod(query);
  const range = dateWhere(period.from, period.to);

  const [orders, salesSummaries, expenses, purchases, variants] = await Promise.all([
    prisma.order.findMany({
      where: { isActive: true, ...(range ? { orderDate: range } : {}) },
      select: {
        id: true,
        orderType: true,
        status: true,
        source: true,
        orderDate: true,
        amountReceived: true,
        productCost: true,
        subtotal: true,
        customerPayable: true,
        deliveryCharge: true,
        dueAmount: true,
        netProfit: true,
        items: {
          select: {
            productVariantId: true,
            quantity: true,
            totalSellingPrice: true,
            totalCost: true,
            profit: true,
            productVariant: {
              select: {
                name: true,
                sku: true,
                product: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.salesSummary.findMany({
      where: { isActive: true, ...(range ? { date: range } : {}) },
      select: {
        date: true,
        source: true,
        amountBdt: true,
        estimatedProductCost: true,
      },
    }),
    prisma.expense.findMany({
      where: { isActive: true, ...(range ? { date: range } : {}) },
      select: { category: true, amountBdt: true, date: true },
    }),
    prisma.purchase.findMany({
      where: {
        status: { not: PurchaseStatus.CANCELLED },
        ...(range ? { purchaseDate: range } : {}),
      },
      select: { status: true, totalLandedCostBdt: true },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      select: { currentStock: true, lowStockAlert: true, currentLandedCost: true },
    }),
  ]);

  const realizedOrders = orders.filter(isRealizedOrder);
  const pendingPreOrders = orders.filter(
    (order) =>
      order.orderType === OrderType.PRE_ORDER && order.status === OrderStatus.PRE_ORDERED,
  );
  const activePreOrders = orders.filter(
    (order) =>
      order.orderType === OrderType.PRE_ORDER &&
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.RETURNED &&
      order.status !== OrderStatus.DELIVERED,
  );

  const orderSalesReceived = sumDecimals(realizedOrders.map((order) => order.amountReceived));
  const salesSummaryReceived = sumDecimals(salesSummaries.map((summary) => summary.amountBdt));
  const salesReceived = orderSalesReceived.add(salesSummaryReceived);
  const getOrderProductCost = (order: (typeof orders)[number]) =>
    withLegacyFallback(
      order.productCost,
      sumDecimals(order.items.map((item) => item.totalCost)),
    );
  const orderProductCost = sumDecimals(realizedOrders.map(getOrderProductCost));
  const salesSummaryEstimatedCost = sumDecimals(
    salesSummaries.flatMap((summary) =>
      summary.estimatedProductCost === null ? [] : [summary.estimatedProductCost],
    ),
  );
  const hasMissingSalesSummaryCost = salesSummaries.some(
    (summary) => summary.estimatedProductCost === null,
  );
  const hasKnownSalesSummaryCost = salesSummaries.some(
    (summary) => summary.estimatedProductCost !== null,
  );
  const productCostSold = orderProductCost.add(salesSummaryEstimatedCost);
  const grossProfit = salesReceived.sub(productCostSold);

  const operatingExpenseRows = expenses.filter(
    (expense) => isOperatingExpenseCategory(expense.category),
  );
  const operatingExpenses = sumDecimals(operatingExpenseRows.map((expense) => expense.amountBdt));
  const totalExpenses = sumDecimals(expenses.map((expense) => expense.amountBdt));
  const productPurchaseCashOut = sumDecimals(
    expenses
      .filter((expense) => expense.category === ExpenseCategory.PRODUCT_PURCHASE)
      .map((expense) => expense.amountBdt),
  );
  const cargoCashOut = sumDecimals(
    expenses
      .filter((expense) => expense.category === ExpenseCategory.CARGO_WEIGHT_CHARGE)
      .map((expense) => expense.amountBdt),
  );
  const purchaseAndCargoCashOut = productPurchaseCashOut.add(cargoCashOut);
  const netProfit = grossProfit.sub(operatingExpenses);
  const profitMargin = salesReceived.isZero()
    ? 0
    : Number(netProfit.div(salesReceived).mul(100).toFixed(2));

  const currentStockValue = variants.reduce(
    (total, variant) =>
      total.add((variant.currentLandedCost ?? ZERO).mul(variant.currentStock)),
    ZERO,
  );
  const totalUnitsInStock = variants.reduce((total, variant) => total + variant.currentStock, 0);
  const lowStockItems = variants.filter(
    (variant) =>
      variant.lowStockAlert != null && variant.currentStock <= variant.lowStockAlert,
  ).length;

  const purchaseInvestment = sumDecimals(purchases.map((purchase) => purchase.totalLandedCostBdt));
  const purchaseValue = (statuses: PurchaseStatus[]) =>
    sumDecimals(
      purchases
        .filter((purchase) => statuses.includes(purchase.status))
        .map((purchase) => purchase.totalLandedCostBdt),
    );

  const getPreOrderPayable = (order: (typeof orders)[number]) =>
    withLegacyFallback(order.customerPayable, order.subtotal);
  const preOrderValue = sumDecimals(pendingPreOrders.map(getPreOrderPayable));
  const preOrderAdvanceReceived = sumDecimals(
    pendingPreOrders.map((order) => order.amountReceived),
  );
  const preOrderDue = sumDecimals(
    pendingPreOrders.map((order) => {
      const calculatedDue = zeroIfNegative(
        getPreOrderPayable(order).add(order.deliveryCharge).sub(order.amountReceived),
      );
      const storedDue = zeroIfNegative(order.dueAmount);
      return storedDue.greaterThan(calculatedDue) ? storedDue : calculatedDue;
    }),
  );
  const preOrderExpectedProfit = sumDecimals(pendingPreOrders.map((order) => order.netProfit));

  const sourceTotals = new Map<OrderSource, Prisma.Decimal>(
    Object.values(OrderSource).map((source) => [source, ZERO]),
  );
  realizedOrders.forEach((order) => {
    sourceTotals.set(order.source, (sourceTotals.get(order.source) ?? ZERO).add(order.amountReceived));
  });
  salesSummaries.forEach((summary) => {
    const source = summary.source ?? OrderSource.OTHER;
    sourceTotals.set(source, (sourceTotals.get(source) ?? ZERO).add(summary.amountBdt));
  });

  const categoryTotals = new Map<ExpenseCategory, Prisma.Decimal>(
    Object.values(ExpenseCategory).map((category) => [category, ZERO]),
  );
  expenses.forEach((expense) => {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? ZERO).add(expense.amountBdt),
    );
  });

  const trends = new Map<
    string,
    { sales: Prisma.Decimal; productCost: Prisma.Decimal; expenses: Prisma.Decimal }
  >();
  const getTrend = (date: Date) => {
    const key = monthKey(date);
    const value = trends.get(key) ?? { sales: ZERO, productCost: ZERO, expenses: ZERO };
    trends.set(key, value);
    return value;
  };
  realizedOrders.forEach((order) => {
    const trend = getTrend(order.orderDate);
    trend.sales = trend.sales.add(order.amountReceived);
    trend.productCost = trend.productCost.add(getOrderProductCost(order));
  });
  salesSummaries.forEach((summary) => {
    const trend = getTrend(summary.date);
    trend.sales = trend.sales.add(summary.amountBdt);
    if (summary.estimatedProductCost !== null) {
      trend.productCost = trend.productCost.add(summary.estimatedProductCost);
    }
  });
  operatingExpenseRows.forEach((expense) => {
    const trend = getTrend(expense.date);
    trend.expenses = trend.expenses.add(expense.amountBdt);
  });

  const products = new Map<
    number,
    {
      productVariantId: number;
      name: string;
      sku: string | null;
      quantity: number;
      revenue: Prisma.Decimal;
      profit: Prisma.Decimal;
    }
  >();
  realizedOrders.forEach((order) => {
    order.items.forEach((item) => {
      const current = products.get(item.productVariantId) ?? {
        productVariantId: item.productVariantId,
        name: `${item.productVariant.product.name} · ${item.productVariant.name}`,
        sku: item.productVariant.sku,
        quantity: 0,
        revenue: ZERO,
        profit: ZERO,
      };
      current.quantity += item.quantity;
      current.revenue = current.revenue.add(item.totalSellingPrice);
      current.profit = current.profit.add(item.profit);
      products.set(item.productVariantId, current);
    });
  });
  const productRows = Array.from(products.values());
  const top = (sorter: (a: (typeof productRows)[number], b: (typeof productRows)[number]) => number) =>
    [...productRows].sort(sorter).slice(0, 5).map(topProductView);

  const grossProfitLabel = hasMissingSalesSummaryCost
    ? "Known Gross Profit"
    : "Gross Profit";

  return {
    period: {
      dateRange: query.dateRange,
      from: period.from?.toISOString() ?? null,
      to: period.to?.toISOString() ?? null,
      label: period.label,
    },
    summary: {
      salesReceived: money(salesReceived),
      productCostSold: money(productCostSold),
      grossProfit: money(grossProfit),
      grossProfitLabel,
      operatingExpenses: money(operatingExpenses),
      netProfit: money(netProfit),
      currentStockValue: money(currentStockValue),
      purchaseInvestment: money(purchaseInvestment),
      preOrderValue: money(preOrderValue),
      preOrderDue: money(preOrderDue),
    },
    sales: {
      orderSalesReceived: money(orderSalesReceived),
      salesSummaryReceived: money(salesSummaryReceived),
      totalSalesReceived: money(salesReceived),
      realizedOrdersCount: realizedOrders.length,
      averageOrderValue: money(
        realizedOrders.length ? orderSalesReceived.div(realizedOrders.length) : ZERO,
      ),
      bySource: Array.from(sourceTotals.entries()).map(([source, amount]) => ({
        key: source,
        source,
        label: source.replaceAll("_", " "),
        amount: money(amount),
      })),
    },
    finance: {
      orderProductCost: money(orderProductCost),
      salesSummaryEstimatedCost:
        hasKnownSalesSummaryCost || salesSummaries.length === 0
          ? money(salesSummaryEstimatedCost)
          : null,
      grossProfit: money(grossProfit),
      grossProfitLabel,
      operatingExpenses: money(operatingExpenses),
      netProfit: money(netProfit),
      profitMargin,
      trackedMoneySpent: money(totalExpenses),
    },
    expenses: {
      totalExpenses: money(totalExpenses),
      operatingExpenses: money(operatingExpenses),
      productPurchaseCashOut: money(productPurchaseCashOut),
      cargoCashOut: money(cargoCashOut),
      purchaseAndCargoCashOut: money(purchaseAndCargoCashOut),
      byGroup: [
        ...EXPENSE_GROUPS.map((group) => ({
          key: group.key,
          label: group.label,
          amount: money(sumDecimals(group.categories.map((category) => categoryTotals.get(category) ?? ZERO))),
        })),
        {
          key: "purchase_cargo_cash_out",
          label: "Product Purchase / Cargo Cash Out",
          amount: money(purchaseAndCargoCashOut),
        },
      ],
      byCategory: Object.values(ExpenseCategory).map((category) => ({
        key: category,
        category,
        label: category.replaceAll("_", " "),
        amount: money(categoryTotals.get(category) ?? ZERO),
      })),
    },
    inventory: {
      currentStockValue: money(currentStockValue),
      totalUnitsInStock,
      lowStockItems,
      purchaseInvestment: money(purchaseInvestment),
      productPurchaseCashOut: money(productPurchaseCashOut),
      cargoCashOut: money(cargoCashOut),
      purchaseAndCargoCashOut: money(purchaseAndCargoCashOut),
      inCargoValue: money(purchaseValue([PurchaseStatus.IN_CARGO])),
      orderedValue: money(purchaseValue([PurchaseStatus.ORDERED])),
      receivedPurchaseValue: money(
        purchaseValue([PurchaseStatus.RECEIVED, PurchaseStatus.PARTIALLY_RECEIVED]),
      ),
    },
    preOrders: {
      activePreOrders: activePreOrders.length,
      preOrderValue: money(preOrderValue),
      advanceReceived: money(preOrderAdvanceReceived),
      dueAmount: money(preOrderDue),
      expectedProfit: money(preOrderExpectedProfit),
      readyToDeliverCount: orders.filter(
        (order) =>
          order.orderType === OrderType.PRE_ORDER &&
          order.status === OrderStatus.READY_TO_DELIVER,
      ).length,
      notReceivedCount: pendingPreOrders.length,
    },
    trends: Array.from(trends.entries())
      .sort(([first], [second]) => first.localeCompare(second))
      .slice(-12)
      .map(([key, value]) => ({
        key,
        label: new Intl.DateTimeFormat("en-BD", { month: "short", year: "2-digit" }).format(
          new Date(`${key}-01T00:00:00`),
        ),
        sales: money(value.sales),
        expenses: money(value.expenses),
        profit: money(value.sales.sub(value.productCost).sub(value.expenses)),
      })),
    topProducts: {
      byQuantity: top((a, b) => b.quantity - a.quantity),
      byRevenue: top((a, b) => b.revenue.comparedTo(a.revenue)),
      byProfit: top((a, b) => b.profit.comparedTo(a.profit)),
    },
    notes: [
      "Product purchase and cargo acquisition cash out are tracked separately from operating expenses.",
      "Unsold inventory is not treated as a loss.",
      "PRE_ORDERED orders are not counted as realized sales until ready to deliver or delivered.",
      ...(hasMissingSalesSummaryCost
        ? [
            "Some historical Sales Summary records do not have estimated product cost, so lifetime profit may be incomplete.",
          ]
        : []),
    ],
  };
}
