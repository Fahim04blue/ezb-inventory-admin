import { type ProductView, type ProductVariantView } from "../types/product";

export function getTotalStock(product: ProductView): number {
  return product.variants.reduce((acc, variant) => acc + variant.currentStock, 0);
}

export function getActiveVariantCount(product: ProductView): number {
  return product.variants.filter((variant) => variant.isActive).length;
}

export function getInactiveVariantCount(product: ProductView): number {
  return product.variants.filter((variant) => !variant.isActive).length;
}

export function getPriceRange(product: ProductView): string {
  const prices = product.variants
    .map((v) => Number(v.defaultSellingPrice))
    .filter((p) => !isNaN(p) && p > 0);

  if (prices.length === 0) return "N/A";
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return `৳${min}`;
  return `৳${min} - ৳${max}`;
}

export function getVariantStockStatus(variant: ProductVariantView): {
  label: string;
  className: string;
} {
  if (!variant.isActive) {
    return { label: "Inactive", className: "bg-muted text-muted-foreground border-transparent" };
  }
  
  if (variant.currentStock <= 0) {
    return { label: "Out of stock", className: "bg-red-50 text-red-700 border-red-200" };
  }
  
  if (variant.lowStockAlert !== null && variant.currentStock <= variant.lowStockAlert) {
    return { label: "Low stock", className: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  }
  
  return { label: "In stock", className: "bg-green-50 text-green-700 border-green-200" };
}
