"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { CrudPageHeader } from "@/components/common/crud-page-header";
import { ProductsList } from "./products-list";
import { ProductFormDrawer } from "./product-form-drawer";
import { ProductsMobileView } from "./products-mobile-view";
import { type ProductOptionView, type ProductView, type ProductVariantView, type DrawerState } from "../types/product";

export function ProductsPageClient({
  initialProducts,
  initialBrands,
  initialCategories,
}: {
  initialProducts: ProductView[];
  initialBrands: ProductOptionView[];
  initialCategories: ProductOptionView[];
}) {
  const [products, setProducts] = useState<ProductView[]>(initialProducts);
  const [brands, setBrands] = useState<ProductOptionView[]>(initialBrands);
  const [categories, setCategories] = useState<ProductOptionView[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [selectedMobileProduct, setSelectedMobileProduct] = useState<ProductView | null>(null);

  function closeMobileDetails() {
    setSelectedMobileProduct(null);
  }

  function openMobileAwareDrawer(nextDrawer: Exclude<DrawerState, null>) {
    closeMobileDetails();
    setDrawer(nextDrawer);
  }

  async function loadData() {
    setIsLoading(true);

    try {
      const [productsData, brandsData, categoriesData] = await Promise.all([
        apiClient<{ products: ProductView[] }>("/api/products", { cache: "no-store", showErrorToast: false }),
        apiClient<{ brands: ProductOptionView[] }>("/api/brands", { cache: "no-store", showErrorToast: false }),
        apiClient<{ categories: ProductOptionView[] }>("/api/categories", { cache: "no-store", showErrorToast: false }),
      ]);

      if (productsData) setProducts(productsData.products);
      if (brandsData) setBrands(brandsData.brands);
      if (categoriesData) setCategories(categoriesData.categories);
      if (productsData && selectedMobileProduct) {
        setSelectedMobileProduct(
          productsData.products.find((product) => product.id === selectedMobileProduct.id) || null,
        );
      }
    } catch {
      // toast will handle it if we passed showErrorToast: true, but let's allow the initial load to fail quietly or show one error
      console.error("Failed to load product data");
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleProductStatus(product: ProductView) {
    try {
      await apiClient<{ product: ProductView }>(`/api/products/${product.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !product.isActive }),
        showSuccessToast: true,
      });
      await loadData();
    } catch {
      // Error handled by apiClient toast
    }
  }

  async function toggleVariantStatus(variant: ProductVariantView) {
    try {
      await apiClient<{ variant: ProductVariantView }>(`/api/product-variants/${variant.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !variant.isActive }),
        showSuccessToast: true,
      });
      await loadData();
    } catch {
      // Error handled by apiClient toast
    }
  }

  async function handleDrawerSuccess() {
    setDrawer(null);
    setSelectedMobileProduct(null);
    await loadData();
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="hidden md:block">
        <CrudPageHeader
          title="Products & Inventory"
          description="Manage product families, variants, and current stock."
          onRefresh={() => void loadData()}
          isRefreshing={isLoading}
          onAdd={() => setDrawer({ mode: "create" })}
          addLabel="Add Product"
        />
      </div>

      <ProductsMobileView
        isLoading={isLoading}
        onAddProduct={() => setDrawer({ mode: "create" })}
        onAddVariant={(product) => openMobileAwareDrawer({ mode: "add-variant", product })}
        onCloseDetails={closeMobileDetails}
        onEditProduct={(product) => openMobileAwareDrawer({ mode: "edit-product", product })}
        onEditVariant={(product, variant) => openMobileAwareDrawer({ mode: "edit-variant", product, variant })}
        onSelectProduct={setSelectedMobileProduct}
        onToggleProductStatus={(product) => void toggleProductStatus(product)}
        onToggleVariantStatus={(variant) => void toggleVariantStatus(variant)}
        products={products}
        selectedProduct={selectedMobileProduct}
      />

      <ProductsList
        isLoading={isLoading}
        products={products}
        onEditProduct={(product) => setDrawer({ mode: "edit-product", product })}
        onToggleProductStatus={(product) => void toggleProductStatus(product)}
        onAddVariant={(product) => setDrawer({ mode: "add-variant", product })}
        onEditVariant={(product, variant) => setDrawer({ mode: "edit-variant", product, variant })}
        onToggleVariantStatus={(variant) => void toggleVariantStatus(variant)}
      />

      <ProductFormDrawer
        drawer={drawer}
        brands={brands}
        categories={categories}
        onClose={() => setDrawer(null)}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
}
