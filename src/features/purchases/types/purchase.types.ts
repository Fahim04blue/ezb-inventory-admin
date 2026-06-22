import type {
  Currency,
  PaymentStatus,
  ProductUnit,
  PurchaseStatus,
} from "@/lib/domain-enums";

export type PurchaseView = {
  id: number;
  referenceNumber: string;
  title: string | null;
  supplierId: number | null;
  purchaseCurrency: Currency;
  productSubtotalForeign: string;
  productSubtotalBdt: string;
  productAdjustmentForeign: string | null;
  productAdjustmentBdt: string | null;
  cargoChargeForeign: string | null;
  cargoChargeBdt: string | null;
  otherImportCostBdt: string | null;
  totalLandedCostBdt: string;
  purchaseExchangeRateToBdt: string;
  cargoExchangeRateToBdt: string | null;
  purchaseRateId: number | null;
  cargoCurrency: Currency | null;
  cargoRateId: number | null;
  orderedAt: Date | null;
  purchaseDate: Date;
  receivedAt: Date | null;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  country: string | null;
  notes: string | null;
  createdById: number | null;
  updatedById: number | null;
  createdAt: Date;
  updatedAt: Date;
  supplier: { id: number; name: string } | null;
  items: PurchaseItemView[];
};

export type PurchaseItemView = {
  id: number;
  purchaseId: number;
  productVariantId: number;
  quantity: number;
  receivedQuantity: number;
  reservedPreOrderQuantity: number;
  unitPriceForeign: string;
  unitBuyingCostBdt: string;
  productSizeValue: string | null;
  productSizeUnit: ProductUnit | null;
  shippingWeightKg: string | null;
  allocatedCargoCostBdt: string;
  allocatedOtherCostBdt: string;
  finalUnitLandedCostBdt: string;
  totalLandedCostBdt: string;
  suggestedSellingPrice: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  productVariant: { id: number; name: string; sku: string | null } & {
    product: { id: number; name: string };
  };
};

export type ApiSuccess<T> = {
  status: "success";
  code: number;
  message: string;
  data: T;
};

export type ApiError = {
  status: "error";
  code: number;
  message: string;
  data: unknown;
};

export type PurchaseDrawerState =
  | { mode: "create" }
  | { mode: "edit"; purchase: PurchaseView }
  | null;
