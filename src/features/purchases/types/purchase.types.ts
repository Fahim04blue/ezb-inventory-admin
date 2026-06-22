import { Purchase, PurchaseItem, Supplier, ProductVariant, Product } from "@prisma/client";

export type PurchaseView = Omit<Purchase, "productSubtotalForeign" | "productSubtotalBdt" | "productAdjustmentForeign" | "productAdjustmentBdt" | "cargoChargeForeign" | "cargoChargeBdt" | "otherImportCostBdt" | "totalLandedCostBdt" | "purchaseExchangeRateToBdt" | "cargoExchangeRateToBdt"> & {
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
  supplier: Pick<Supplier, "id" | "name"> | null;
  items: PurchaseItemView[];
};

export type PurchaseItemView = Omit<PurchaseItem, "unitPriceForeign" | "unitBuyingCostBdt" | "productSizeValue" | "shippingWeightKg" | "allocatedCargoCostBdt" | "allocatedOtherCostBdt" | "finalUnitLandedCostBdt" | "totalLandedCostBdt" | "suggestedSellingPrice"> & {
  unitPriceForeign: string;
  unitBuyingCostBdt: string;
  productSizeValue: string | null;
  shippingWeightKg: string | null;
  allocatedCargoCostBdt: string;
  allocatedOtherCostBdt: string;
  finalUnitLandedCostBdt: string;
  totalLandedCostBdt: string;
  suggestedSellingPrice: string | null;
  productVariant: Pick<ProductVariant, "id" | "name" | "sku"> & {
    product: Pick<Product, "id" | "name">;
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
