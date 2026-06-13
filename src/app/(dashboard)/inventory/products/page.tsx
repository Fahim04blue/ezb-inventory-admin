import { prisma } from "@/lib/prisma";
import {
  ProductsPageClient,
  type ProductOptionView,
  type ProductView,
} from "@/features/products/components/products-page-client";

async function getProducts(): Promise<ProductView[]> {
  const products = await prisma.product.findMany({
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      variants: {
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
      },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    brandId: product.brandId,
    categoryId: product.categoryId,
    brand: product.brand,
    category: product.category,
    description: product.description,
    isActive: product.isActive,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      currentStock: variant.currentStock,
      lowStockAlert: variant.lowStockAlert,
      defaultSellingPrice: variant.defaultSellingPrice?.toString() ?? null,
      productWeight: variant.productWeight?.toString() ?? null,
      shippingWeight: variant.shippingWeight?.toString() ?? null,
      isActive: variant.isActive,
    })),
  }));
}

async function getProductOptions(): Promise<{
  brands: ProductOptionView[];
  categories: ProductOptionView[];
}> {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
  ]);

  return { brands, categories };
}

export default async function ProductsPage() {
  const [initialProducts, productOptions] = await Promise.all([
    getProducts(),
    getProductOptions(),
  ]);

  return (
    <ProductsPageClient
      initialBrands={productOptions.brands}
      initialCategories={productOptions.categories}
      initialProducts={initialProducts}
    />
  );
}
