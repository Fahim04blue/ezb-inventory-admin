import { PaymentStatus, SheinBatchItemStatus, SheinBatchStatus } from "@/lib/domain-enums";
import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));
const money = z.coerce.number().min(0);
const optionalMoney = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().min(0).optional(),
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
  status: z.nativeEnum(SheinBatchStatus).default(SheinBatchStatus.CONFIRMED),
  notes: optionalText,
});

export const sheinBatchItemSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(100),
  address: optionalText,
  productName: z.string().trim().min(1).max(300),
  sheinLink: optionalText,
  imageUrl: optionalText,
  screenshotUrl: optionalText,
  size: optionalText,
  color: optionalText,
  quantity: z.coerce.number().int().positive().default(1),
  customerQuotedPriceBdt: money,
  advanceReceivedBdt: money.default(0),
  actualSheinPriceRm: optionalMoney.nullable(),
  bankRateSnapshot: optionalMoney.nullable(),
  actualWeightGram: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().int().min(0).optional(),
  ).nullable(),
  customerWeightRateSnapshot: money.default(1.25),
  actualCargoRateSnapshot: money.default(0.98),
  status: z.nativeEnum(SheinBatchItemStatus).default(SheinBatchItemStatus.CONFIRMED),
});

export const createNormalOrderFromSheinSchema = z.object({
  phone: z.string().trim().min(1),
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

export const updateSheinCustomerAdvanceSchema = z.object({
  customerName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  advanceReceivedBdt: money,
});

export const sheinBatchItemsBulkSchema = z.object({
  items: z.array(sheinBatchItemSchema).min(1),
});

export type SheinBatchInput = z.output<typeof sheinBatchSchema>;
export type SheinBatchItemInput = z.output<typeof sheinBatchItemSchema>;
export type SheinBatchItemsBulkInput = z.output<typeof sheinBatchItemsBulkSchema>;
export type CreateNormalOrderFromSheinInput = z.output<typeof createNormalOrderFromSheinSchema>;
export type UpdateSheinCustomerAdvanceInput = z.output<typeof updateSheinCustomerAdvanceSchema>;
