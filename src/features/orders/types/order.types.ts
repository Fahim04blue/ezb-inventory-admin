import type {
  OrderSource,
  OrderStatus,
  OrderType,
  PaymentStatus,
  PurchaseStatus,
} from "@prisma/client";

export type OrderItemView = {
  id: number;
  productVariantId: number;
  purchaseItemId: number | null;
  productName: string;
  variantName: string;
  sku: string | null;
  currentStock: number;
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
};

export type OrderView = {
  id: number;
  orderNumber: string;
  orderType: OrderType;
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
  customerPayable: string;
  courierDeduction: string;
  amountReceived: string;
  totalAmount: string;
  paidAmount: string;
  dueAmount: string;
  productCost: string;
  grossProfit: string;
  netProfit: string;
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
  brandName: string | null;
  categoryName: string | null;
  quantity: number;
  receivedQuantity: number;
  reservedPreOrderQuantity: number;
  availableIncomingQuantity: number;
  finalUnitLandedCostBdt: string;
  suggestedSellingPrice: string | null;
};

export type OrdersPageData = {
  orders: OrderView[];
  variantOptions: OrderVariantOption[];
  preOrderPurchaseItems: PreOrderPurchaseItemOption[];
};

export type OrderFilters = {
  orderType: "ALL" | OrderType;
  status: "ALL" | OrderStatus;
  paymentStatus: "ALL" | PaymentStatus;
  source: "ALL" | OrderSource;
  date: "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH";
  search: string;
};
