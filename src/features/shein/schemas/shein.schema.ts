import { PaymentStatus, SheinBatchItemStatus, SheinBatchStatus } from "@/lib/domain-enums";
import { z } from "zod";
import { normalizeSheinBatchItemStatus, normalizeSheinBatchStatus } from "../utils/shein-status";

const optionalText = z.preprocess(
  (value) => (value == null ? "" : value),
  z.string().trim().optional().or(z.literal("")),
);
const optionalStoredText = (max: number) =>
  z.preprocess(
    (value) => (value == null ? "" : value),
    z.string().trim().max(max),
  );
const sheinItemName = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() ? value : "SHEIN item",
  z.string().trim().max(300),
);
const money = z.preprocess(
  (value) => (value == null || value === "" || (typeof value === "number" && Number.isNaN(value)) ? 0 : value),
  z.coerce.number().min(0),
);
const optionalMoney = z.preprocess(
  (value) => (value === "" || value == null || (typeof value === "number" && Number.isNaN(value)) ? undefined : value),
  z.coerce.number().min(0).optional(),
);
const quantity = z.preprocess(
  (value) => (value == null || value === "" || (typeof value === "number" && Number.isNaN(value)) ? 1 : value),
  z.coerce.number().int().positive().default(1),
);
const sheinBatchItemStatus = z.preprocess(
  (value) => normalizeSheinBatchItemStatus(value),
  z.nativeEnum(SheinBatchItemStatus).default(SheinBatchItemStatus.CONFIRMED),
);
const sheinBatchStatus = z.preprocess(
  (value) => normalizeSheinBatchStatus(value),
  z.nativeEnum(SheinBatchStatus).default(SheinBatchStatus.CONFIRMED),
);

export const sheinBatchSchema = z.object({
  batchName: z.string().trim().min(1).max(200),
  sourceCountry: z.string().trim().min(1).max(100).default("Malaysia"),
  currency: z.string().trim().min(1).max(10).default("MYR"),
  customerRmRate: money.default(33),
  bankRate: optionalMoney.nullable(),
  customerWeightRatePerGram: money.default(1.25),
  actualCargoRatePerGram: money.default(0.98),
  orderDate: z.coerce.date().optional().nullable(),
  sheinOrderNumbers: optionalText,
  sheinTrackingNumber: optionalText,
  status: sheinBatchStatus,
  notes: optionalText,
});

export const sheinBatchItemSchema = z.object({
  customerName: optionalStoredText(200),
  phone: optionalStoredText(100),
  customerSource: optionalText,
  address: optionalText,
  productName: sheinItemName,
  sku: optionalText,
  sheinLink: optionalText,
  imageUrl: optionalText,
  screenshotUrl: optionalText,
  size: optionalText,
  color: optionalText,
  quantity,
  customerQuotedPriceBdt: money,
  advanceReceivedBdt: money.default(0),
  actualSheinPriceRm: optionalMoney.nullable(),
  bankRateSnapshot: optionalMoney.nullable(),
  actualWeightGram: z.preprocess(
    (value) => (value === "" || value == null || (typeof value === "number" && Number.isNaN(value)) ? null : value),
    z.coerce.number().int().min(0).nullable(),
  ),
  customerWeightRateSnapshot: money.default(1.25),
  actualCargoRateSnapshot: money.default(0.98),
  status: sheinBatchItemStatus,
});

export const createNormalOrderFromSheinSchema = z.object({
  phone: optionalStoredText(100),
  itemIds: z.array(z.string().min(1)).min(1),
  deliveryCharge: money.default(0),
  weightCharge: money.default(0),
  actualWeightCharge: money.default(0),
  totalWeightGram: money.default(0),
  courierFee: money.default(0),
  discount: money.default(0),
  amountReceived: money.default(0),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  notes: optionalText,
});

export const updateSheinCustomerOrderCostingSchema = z.object({
  phone: optionalStoredText(100),
  itemIds: z.array(z.string().min(1)).min(1),
  weightCharge: money.default(0),
  totalWeightGram: money.default(0),
});

export const updateSheinCustomerAdvanceSchema = z.object({
  customerName: z.string().trim().min(1),
  phone: optionalStoredText(100),
  advanceReceivedBdt: money,
});

export const assignSheinItemsCustomerSchema = z.object({
  itemIds: z.array(z.string().trim().min(1)).min(1).max(100),
  customerName: z.string().trim().min(1).max(200),
  phone: optionalStoredText(100),
  customerSource: optionalStoredText(100),
  address: optionalStoredText(500),
  advanceReceivedBdt: money,
});

export const updateSheinBatchItemQuoteSchema = z.object({
  customerQuotedPriceBdt: money,
});

export const reverseSheinCustomerOrderSchema = z.object({
  itemIds: z.array(z.string().trim().min(1)).min(1).max(200),
});

export const sheinBatchItemsBulkSchema = z.object({
  items: z.array(sheinBatchItemSchema).min(1),
});

export type SheinBatchInput = z.output<typeof sheinBatchSchema>;
export type SheinBatchItemInput = z.output<typeof sheinBatchItemSchema>;
export type SheinBatchItemsBulkInput = z.output<typeof sheinBatchItemsBulkSchema>;
export type CreateNormalOrderFromSheinInput = z.output<typeof createNormalOrderFromSheinSchema>;
export type UpdateSheinCustomerOrderCostingInput = z.output<typeof updateSheinCustomerOrderCostingSchema>;
export type UpdateSheinCustomerAdvanceInput = z.output<typeof updateSheinCustomerAdvanceSchema>;
export type AssignSheinItemsCustomerInput = z.output<typeof assignSheinItemsCustomerSchema>;
export type UpdateSheinBatchItemQuoteInput = z.output<typeof updateSheinBatchItemQuoteSchema>;
export type ReverseSheinCustomerOrderInput = z.output<typeof reverseSheinCustomerOrderSchema>;
