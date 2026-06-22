import type { OrderSource } from "@/lib/domain-enums";

export type SalesSummaryView = {
  id: number;
  date: string;
  title: string;
  source: OrderSource | null;
  amountBdt: string;
  estimatedProductCost: string | null;
  estimatedGrossProfit: string | null;
  deliveryChargeCollectedBdt: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DrawerState = {
  mode: "create" | "edit";
  salesSummary?: SalesSummaryView;
} | null;
