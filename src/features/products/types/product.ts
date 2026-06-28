export type ProductOptionView = {
  id: number;
  name: string;
  isActive: boolean;
};

export type ProductVariantView = {
  id: number;
  name: string;
  sku: string | null;
  currentStock: number;
  lowStockAlert: number | null;
  defaultSellingPrice: string | null;
  productSizeValue: string | null;
  productSizeUnit: "ML" | "G" | "KG" | "PCS" | "SET" | null;
  shippingWeightKg: string | null;
  isActive: boolean;
  imagePath: string | null;
  imageUrl: string | null;
  imageAltText: string | null;
};

export type ProductView = {
  id: number;
  name: string;
  brandId: number | null;
  categoryId: number | null;
  brand: ProductOptionView | null;
  category: ProductOptionView | null;
  description: string | null;
  isActive: boolean;
  variants: ProductVariantView[];
};

export type ApiSuccess<T> = {
  status: "success";
  code: number;
  message: string;
  data: T;
};

export type ApiError = {
  status: "error";
  code: number;
  message: string;
  data: unknown;
};

export type DrawerState =
  | { mode: "create" }
  | { mode: "edit-product"; product: ProductView }
  | { mode: "add-variant"; product: ProductView }
  | { mode: "edit-variant"; product: ProductView; variant: ProductVariantView }
  | null;
