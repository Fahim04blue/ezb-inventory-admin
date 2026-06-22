import type { ExpenseCategory, OrderSource } from "@/lib/domain-enums";

export type ReportDateRange =
  | "all"
  | "today"
  | "this_month"
  | "last_month"
  | "last_30_days"
  | "custom";

export type ReportFilters = {
  dateRange: ReportDateRange;
  from: string;
  to: string;
};

export type MoneyBreakdownItem = {
  key: string;
  label: string;
  amount: string;
};

export type ReportTrendPoint = {
  key: string;
  label: string;
  sales: string;
  expenses: string;
  profit: string;
};

export type TopProductReport = {
  productVariantId: number;
  name: string;
  sku: string | null;
  quantity: number;
  revenue: string;
  profit: string;
};

export type ReportsOverview = {
  period: {
    dateRange: ReportDateRange;
    from: string | null;
    to: string | null;
    label: string;
  };
  summary: {
    salesReceived: string;
    productCostSold: string;
    grossProfit: string;
    grossProfitLabel: string;
    operatingExpenses: string;
    netProfit: string;
    currentStockValue: string;
    purchaseInvestment: string;
    preOrderValue: string;
    preOrderDue: string;
  };
  sales: {
    orderSalesReceived: string;
    salesSummaryReceived: string;
    totalSalesReceived: string;
    realizedOrdersCount: number;
    averageOrderValue: string;
    bySource: Array<MoneyBreakdownItem & { source: OrderSource }>;
  };
  finance: {
    orderProductCost: string;
    salesSummaryEstimatedCost: string | null;
    grossProfit: string;
    grossProfitLabel: string;
    operatingExpenses: string;
    netProfit: string;
    profitMargin: number;
    trackedMoneySpent: string;
  };
  expenses: {
    totalExpenses: string;
    operatingExpenses: string;
    productPurchaseCashOut: string;
    cargoCashOut: string;
    purchaseAndCargoCashOut: string;
    byGroup: MoneyBreakdownItem[];
    byCategory: Array<MoneyBreakdownItem & { category: ExpenseCategory }>;
  };
  inventory: {
    currentStockValue: string;
    totalUnitsInStock: number;
    lowStockItems: number;
    purchaseInvestment: string;
    productPurchaseCashOut: string;
    cargoCashOut: string;
    purchaseAndCargoCashOut: string;
    inCargoValue: string;
    orderedValue: string;
    receivedPurchaseValue: string;
  };
  preOrders: {
    activePreOrders: number;
    preOrderValue: string;
    advanceReceived: string;
    dueAmount: string;
    expectedProfit: string;
    readyToDeliverCount: number;
    notReceivedCount: number;
  };
  trends: ReportTrendPoint[];
  topProducts: {
    byQuantity: TopProductReport[];
    byRevenue: TopProductReport[];
    byProfit: TopProductReport[];
  };
  notes: string[];
};
