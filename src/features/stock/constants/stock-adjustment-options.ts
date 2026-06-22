import { StockMovementType } from "@/lib/domain-enums";

export const STOCK_ADJUSTMENT_TYPES = [
  "OPENING_STOCK",
  StockMovementType.ADJUSTMENT_IN,
  StockMovementType.ADJUSTMENT_OUT,
  StockMovementType.DAMAGE,
  StockMovementType.GIVEAWAY,
  StockMovementType.PR_SEND,
] as const;

export type StockAdjustmentType = (typeof STOCK_ADJUSTMENT_TYPES)[number];
