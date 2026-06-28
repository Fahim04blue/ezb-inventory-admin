import type { StockMovementDirection, StockMovementType } from "@/lib/domain-enums";
import type { ManualStockAdjustmentType } from "../schemas/stock-schemas";

export type StockSalesTrend =
  | "MANUAL_PRIORITY"
  | "RUNNING_OUT"
  | "FAST_MOVING"
  | "NORMAL"
  | "SLOW_MOVING"
  | "NO_SALES"
  | "OVERSTOCKED"
  | "LOW_STOCK"
  | "OUT_OF_STOCK";

export type StockTrendFilter =
  | "ALL"
  | "PRIORITY"
  | "FAST_MOVING"
  | "RUNNING_OUT"
  | "SLOW_MOVING"
  | "NO_SALES"
  | "OUT_OF_STOCK";

export type StockSortOption =
  | "NEEDS_ATTENTION"
  | "PRIORITY_FIRST"
  | "STOCK_HIGH_TO_LOW"
  | "STOCK_LOW_TO_HIGH"
  | "NAME_A_Z"
  | "RECENTLY_UPDATED";

export type StockVariantOption = {
  id: number;
  name: string;
  sku: string | null;
  productId: number;
  productName: string;
  brandName: string | null;
  categoryName: string | null;
  currentStock: number;
  currentLandedCost: string | null;
  imageUrl: string | null;
  isPriority: boolean;
  priorityNote: string | null;
  priorityRank: number | null;
};

export type StockMovementView = {
  id: number;
  productVariantId: number;
  type: StockMovementType;
  direction: StockMovementDirection;
  quantity: number;
  unitCost: string | null;
  totalCost: string | null;
  note: string | null;
  createdAt: string;
};

export type StockOverviewItem = StockVariantOption & {
  lowStockAlert: number | null;
  stockValue: string;
  lastMovement: StockMovementView | null;
  soldQtyLast30Days: number;
  soldQtyLast60Days: number;
  soldQtyLast90Days: number;
  lastSoldAt: string | null;
  averageDailySales: number;
  daysOfStockLeft: number | null;
  salesTrend: StockSalesTrend;
  stockPriorityScore: number;
  updatedAt: string;
};

export type StockSummary = {
  totalUnits: number;
  stockValue: string;
  lowStockItems: number;
  recentAdjustments: number;
};

export type StockOverviewResponse = {
  summary: StockSummary;
  items: StockOverviewItem[];
  variantOptions: StockVariantOption[];
  recentMovements: StockMovementView[];
};

export type StockFilters = {
  search: string;
  productId: "ALL" | string;
  status: "ALL" | "LOW_STOCK" | "IN_STOCK" | "OUT_OF_STOCK";
  trend: StockTrendFilter;
  sort: StockSortOption;
};

export type StockAdjustmentDrawerState = {
  mode: "create";
  variant?: StockOverviewItem;
  adjustmentType?: ManualStockAdjustmentType;
} | null;
