import { prisma } from "@/lib/prisma";
import {
  ProductOptionsPageClient,
  type ProductOptionItemView,
} from "@/features/product-options/components/product-options-page-client";

async function getProductOptions(): Promise<{
  brands: ProductOptionItemView[];
  categories: ProductOptionItemView[];
}> {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
    }),
    prisma.category.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
    }),
  ]);

  return { brands, categories };
}

export default async function ProductOptionsPage() {
  const initialOptions = await getProductOptions();

  return (
    <ProductOptionsPageClient
      initialBrands={initialOptions.brands}
      initialCategories={initialOptions.categories}
    />
  );
}
