import { z } from "zod";
import { Currency, PaymentStatus, ProductUnit, PurchaseStatus } from "@/lib/domain-enums";

const optionalMoney = z.union([z.string(), z.number()]).optional().transform((value) =>
  value === undefined || value === "" ? undefined : String(value)
);

const optionalSignedMoney = z.union([z.string(), z.number()]).optional().transform((value) =>
  value === undefined || value === "" ? undefined : String(value)
);

const optionalWeight = z.union([z.string(), z.number()]).optional().transform((value) =>
  value === undefined || value === "" ? undefined : String(value)
);

const optionalRelationId = z
  .union([z.coerce.number().int().positive(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }
    return value === "" || value === null ? null : value;
  });

export const purchaseItemSchema = z.object({
  variantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().min(1),
  unitPriceForeign: z.union([z.string(), z.number()]).transform(String).refine((val) => !isNaN(Number(val)) && Number(val) >= 0),
  productSizeValue: optionalWeight,
  productSizeUnit: z.nativeEnum(ProductUnit).optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
  shippingWeightKg: optionalWeight,
  suggestedSellingPrice: optionalMoney,
  notes: z.string().trim().optional(),
});

export const createPurchaseSchema = z.object({
  supplierId: optionalRelationId.optional(),
  country: z.string().trim().optional(),
  purchaseCurrency: z.nativeEnum(Currency),
  purchaseExchangeRateToBdt: z.union([z.string(), z.number()]).transform(String).refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  purchaseRateId: optionalRelationId.optional(),
  productAdjustmentForeign: optionalSignedMoney,
  cargoCurrency: z.nativeEnum(Currency).optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
  cargoExchangeRateToBdt: optionalMoney,
  cargoRateId: optionalRelationId.optional(),
  cargoChargeForeign: optionalMoney,
  otherImportCostBdt: optionalMoney,
  purchaseDate: z.coerce.date(),
  status: z.nativeEnum(PurchaseStatus).default(PurchaseStatus.ORDERED),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  notes: z.string().trim().optional(),
  items: z.array(purchaseItemSchema).min(1),
});

export const updatePurchaseSchema = z.object({
  supplierId: optionalRelationId.optional(),
  country: z.string().trim().optional(),
  purchaseCurrency: z.nativeEnum(Currency),
  purchaseExchangeRateToBdt: z.union([z.string(), z.number()]).transform(String).refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  purchaseRateId: optionalRelationId.optional(),
  productAdjustmentForeign: optionalSignedMoney,
  cargoCurrency: z.nativeEnum(Currency).optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
  cargoExchangeRateToBdt: optionalMoney,
  cargoRateId: optionalRelationId.optional(),
  cargoChargeForeign: optionalMoney,
  otherImportCostBdt: optionalMoney,
  purchaseDate: z.coerce.date(),
  status: z.nativeEnum(PurchaseStatus).default(PurchaseStatus.ORDERED),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  notes: z.string().trim().optional(),
  items: z.array(purchaseItemSchema).min(1),
});

export const updatePurchaseStatusSchema = z.object({
  status: z.nativeEnum(PurchaseStatus),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
});

export const updatePurchasePaymentSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus),
});

export const receivePurchaseStockSchema = z.object({
  items: z
    .array(
      z.object({
        purchaseItemId: z.coerce.number().int().positive(),
        receiveQuantity: z.coerce.number().int().min(0),
      }),
    )
    .min(1),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
export type UpdatePurchaseStatusInput = z.infer<typeof updatePurchaseStatusSchema>;
export type UpdatePurchasePaymentInput = z.infer<typeof updatePurchasePaymentSchema>;
export type ReceivePurchaseStockInput = z.infer<typeof receivePurchaseStockSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
