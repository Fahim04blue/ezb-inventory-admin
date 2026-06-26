export type ProductOptionItemView = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type ProductOptionsTab = "brands" | "categories";

export type ProductOptionsPageData = {
  brands: ProductOptionItemView[];
  categories: ProductOptionItemView[];
};

export type ProductOptionsDrawerState =
  | { entity: "brand"; mode: "create" }
  | { entity: "brand"; mode: "edit"; item: ProductOptionItemView }
  | { entity: "category"; mode: "create" }
  | { entity: "category"; mode: "edit"; item: ProductOptionItemView }
  | null;
