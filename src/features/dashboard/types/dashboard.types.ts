import type {
  OrderStatus,
  PaymentStatus,
  PurchaseStatus,
  StockMovementDirection,
  StockMovementType,
} from "@prisma/client";

export type DashboardOrderItem = {
  id: number;
  orderNumber: string;
  customerName: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amountReceived: string;
  dueAmount: string;
  orderDate: string;
};

export type DashboardPreOrderItem = DashboardOrderItem & {
  customerPhone: string | null;
};

export type DashboardLowStockItem = {
  id: number;
  productName: string;
  variantName: string;
  sku: string | null;
  currentStock: number;
  lowStockAlert: number;
  isPriority: boolean;
  priorityNote: string | null;
};

export type DashboardPurchaseItem = {
  id: number;
  referenceNumber: string;
  supplierName: string | null;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  totalQuantity: number;
  receivedQuantity: number;
  totalLandedCostBdt: string;
  paidAmountBdt: string | null;
  purchaseDate: string;
};

export type DashboardActivityItem = {
  id: string;
  type: "ORDER" | "EXPENSE" | "PURCHASE" | "STOCK";
  title: string;
  description: string;
  amount: string | null;
  occurredAt: string;
  href: string;
  movementType?: StockMovementType;
  movementDirection?: StockMovementDirection;
};

export type DashboardChartPoint = {
  key: string;
  label: string;
  sales: string;
  expenses: string;
};

export type DashboardOverview = {
  generatedAt: string;
  summary: {
    todaySalesReceived: string;
    monthSalesReceived: string;
    monthNetProfit: string;
    currentStockValue: string;
    activePreOrders: number;
    lowStockItems: number;
  };
  focus: {
    readyToDeliver: number;
    waitingPreOrders: number;
    lowStockItems: number;
    supplierPayments: number;
    incomingPurchases: number;
  };
  ordersNeedingAction: DashboardOrderItem[];
  preOrders: {
    readyToDeliverCount: number;
    waitingForStockCount: number;
    activeDue: string;
    items: DashboardPreOrderItem[];
  };
  lowStock: DashboardLowStockItem[];
  incomingPurchases: DashboardPurchaseItem[];
  supplierPaymentAttention: DashboardPurchaseItem[];
  recentActivity: DashboardActivityItem[];
  chart: DashboardChartPoint[];
};
