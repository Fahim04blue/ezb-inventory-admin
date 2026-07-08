import type {
  OrderDeliveryStatus,
  OrderSource,
  OrderStatus,
  OrderType,
  PaymentStatus,
  PurchaseStatus,
  OrderItemFulfillmentStatus,
} from "@/lib/domain-enums";

export type OrderItemView = {
  id: number;
  productVariantId: number | null;
  purchaseItemId: number | null;
  sheinBatchItemId: string | null;
  productName: string;
  variantName: string;
  sku: string | null;
  currentStock: number | null;
  purchaseRef: string | null;
  purchaseSupplierName: string | null;
  purchaseCountry: string | null;
  purchaseItemReceivedQuantity: number | null;
  purchaseItemReservedPreOrderQuantity: number | null;
  quantity: number;
  unitSellingPrice: string;
  unitCost: string;
  totalSellingPrice: string;
  totalCost: string;
  profit: string;
  fulfillmentStatus: OrderItemFulfillmentStatus;
  deliveredQuantity: number;
  deliveredAt: string | null;
  transferredToOrderId: number | null;
  transferredToOrderNumber: string | null;
  transferredAt: string | null;
};

export type OrderView = {
  id: number;
  orderNumber: string;
  orderType: OrderType;
  sourcePreOrderId: number | null;
  sourcePreOrderNumber: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  source: OrderSource;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  orderDate: string;
  subtotal: string;
  discountAmount: string;
  deliveryCharge: string;
  deliveryChargeOnly: string;
  sheinWeightCharge: string;
  customerPayable: string;
  courierDeduction: string;
  amountReceived: string;
  totalAmount: string;
  paidAmount: string;
  dueAmount: string;
  productCost: string;
  grossProfit: string;
  netProfit: string;
  preOrderCollectedAmount: string;
  preOrderRemainingDue: string;
  preOrderRemainingExpectedProfit: string;
  preOrderMovedItemCount: number;
  preOrderMovedItemSummary: string | null;
  preOrderRealizedProfit: string;
  notes: string | null;
  isActive: boolean;
  items: OrderItemView[];
  createdAt: string;
};

export type OrderVariantOption = {
  id: number;
  productName: string;
  variantName: string;
  sku: string | null;
  currentStock: number;
  currentLandedCost: string | null;
  defaultSellingPrice: string | null;
  imageUrl: string | null;
};

export type PreOrderPurchaseItemOption = {
  id: number;
  purchaseId: number;
  purchaseRef: string;
  purchaseStatus: PurchaseStatus;
  supplierName: string | null;
  country: string | null;
  productVariantId: number;
  productName: string;
  variantName: string;
  sku: string | null;
  imageUrl: string | null;
  brandName: string | null;
  categoryName: string | null;
  quantity: number;
  receivedQuantity: number;
  reservedPreOrderQuantity: number;
  availableIncomingQuantity: number;
  finalUnitLandedCostBdt: string;
  suggestedSellingPrice: string | null;
};

export type OrderDeliveryItemView = {
  id: number;
  orderItemId: number;
  productName: string;
  variantName: string;
  sku: string | null;
  quantity: number;
  unitSellingPrice: string;
  unitCost: string;
  totalSellingPrice: string;
  totalCost: string;
  profit: string;
};

export type OrderDeliveryView = {
  id: number;
  orderId: number;
  orderNumber: string;
  deliveryNumber: string;
  status: OrderDeliveryStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  paymentStatus: PaymentStatus;
  discountAmount: string;
  deliveryCharge: string;
  courierDeduction: string;
  amountReceived: string;
  customerPayable: string;
  productCost: string;
  netProfit: string;
  notes: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: OrderDeliveryItemView[];
};

export type OrdersPageData = {
  orders: OrderView[];
  deliveryBatches: OrderDeliveryView[];
  variantOptions: OrderVariantOption[];
  preOrderPurchaseItems: PreOrderPurchaseItemOption[];
};

export type OrderFilters = {
  status: "ALL" | OrderStatus;
  paymentStatus: "ALL" | PaymentStatus;
  source: "ALL" | OrderSource;
  date: "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH";
  search: string;
};

export type OrdersMainTab = "ACTIVE" | "PRE_ORDERS" | "COMPLETED";

export type PreOrderView = "CUSTOMERS" | "AVAILABILITY";

export type PreOrderQuickFilter =
  | "ALL"
  | "WAITING"
  | "PARTIAL"
  | "READY"
  | "PAYMENT_DUE";

export type CompletedQuickFilter = "ALL" | "DELIVERED" | "CANCELLED" | "RETURNED";
