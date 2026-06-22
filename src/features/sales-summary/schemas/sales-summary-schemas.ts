import { z } from "zod";
import { OrderSource } from "@/lib/domain-enums";

const optionalMoneySchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value?.trim() || null)
  .refine(
    (value) => value === null || (Number.isFinite(Number(value)) && Number(value) >= 0),
    "Estimated product cost must be zero or greater",
  );

export const salesSummarySchema = z.object({
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  title: z.string().min(1, "Title is required"),
  source: z.nativeEnum(OrderSource).nullable().optional(),
  amountBdt: z.string().min(1, "Amount is required"),
  estimatedProductCost: optionalMoneySchema,
  deliveryChargeCollectedBdt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type SalesSummaryInput = z.infer<typeof salesSummarySchema>;

export const updateSalesSummaryStatusSchema = z.object({
  isActive: z.boolean(),
});
