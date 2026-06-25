import {
  ProductOptionsPageClient,
} from "@/features/product-options/components/product-options-page-client";
import { listBrands } from "@/features/brands/services/brand-service";
import { listCategories } from "@/features/categories/services/category-service";
import { listRateTypes } from "@/features/rate-types/services/rate-type-service";
import type { ProductOptionsPageData } from "@/features/product-options/types/product-options";

async function getProductOptions(): Promise<ProductOptionsPageData> {
  const [brands, categories, rateTypes] = await Promise.all([
    listBrands(),
    listCategories(),
    listRateTypes(),
  ]);

  return { brands, categories, rateTypes };
}

export default async function ProductOptionsPage() {
  const initialOptions = await getProductOptions();

  return (
    <ProductOptionsPageClient
      initialBrands={initialOptions.brands}
      initialCategories={initialOptions.categories}
      initialRateTypes={initialOptions.rateTypes}
    />
  );
}
