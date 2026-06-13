export type ProductListItem = {
  id: number;
  name: string;
  brandId: number | null;
  categoryId: number | null;
  brand: {
    id: number;
    name: string;
    isActive: boolean;
  } | null;
  category: {
    id: number;
    name: string;
    isActive: boolean;
  } | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  variants: Array<{
    id: number;
    name: string;
    sku: string | null;
    currentStock: number;
    lowStockAlert: number | null;
    defaultSellingPrice: string | null;
    productWeight: string | null;
    shippingWeight: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
};
