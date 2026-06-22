import { StockMovementType } from "@prisma/client";
import { z } from "zod";

export const manualStockAdjustmentTypes = [
  "OPENING_STOCK",
  StockMovementType.ADJUSTMENT_IN,
  StockMovementType.ADJUSTMENT_OUT,
  StockMovementType.DAMAGE,
  StockMovementType.GIVEAWAY,
  StockMovementType.PR_SEND,
] as const;

export type ManualStockAdjustmentType =
  (typeof manualStockAdjustmentTypes)[number];

export const stockAdjustmentSchema = z
  .object({
    variantId: z.coerce.number().int().positive("Product variant is required."),
    adjustmentType: z.enum(manualStockAdjustmentTypes),
    quantity: z.coerce.number().int().positive("Quantity must be a positive integer."),
    unitCostBdt: z
      .union([z.coerce.number().positive(), z.literal(""), z.null(), z.undefined()])
      .optional()
      .transform((value) => (value === "" || value == null ? undefined : value)),
    reason: z.string().trim().max(500).optional().or(z.literal("")),
    date: z.coerce.date(),
  })
  .superRefine((value, ctx) => {
    if (
      (value.adjustmentType === "OPENING_STOCK" ||
        value.adjustmentType === StockMovementType.ADJUSTMENT_IN) &&
      value.unitCostBdt == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unitCostBdt"],
        message: "Unit cost is required for opening stock and stock-in adjustments.",
      });
    }
  });

export type StockAdjustmentFormValues = z.input<typeof stockAdjustmentSchema>;
export type StockAdjustmentInput = z.output<typeof stockAdjustmentSchema>;
