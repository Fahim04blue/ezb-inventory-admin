import type { RateTypeView } from "@/features/rate-types/types/rate-type";

export type ProductOptionItemView = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type ProductOptionsTab = "brands" | "categories" | "rate-types";

export type ProductOptionsPageData = {
  brands: ProductOptionItemView[];
  categories: ProductOptionItemView[];
  rateTypes: RateTypeView[];
};

export type ProductOptionsDrawerState =
  | { entity: "brand"; mode: "create" }
  | { entity: "brand"; mode: "edit"; item: ProductOptionItemView }
  | { entity: "category"; mode: "create" }
  | { entity: "category"; mode: "edit"; item: ProductOptionItemView }
  | { entity: "rateType"; mode: "create" }
  | { entity: "rateType"; mode: "edit"; item: RateTypeView }
  | null;
