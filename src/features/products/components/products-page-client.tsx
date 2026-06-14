"use client";

import { useState } from "react";
import { ProductsPageHeader } from "./products-page-header";
import { ProductsList } from "./products-list";
import { ProductFormDrawer } from "./product-form-drawer";
import { type ProductOptionView, type ProductView, type ProductVariantView, type ApiSuccess, type ApiError, type DrawerState } from "../types/product";

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
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    const [productsResponse, brandsResponse, categoriesResponse] = await Promise.all([
      fetch("/api/products", { credentials: "include", cache: "no-store" }),
      fetch("/api/brands", { credentials: "include", cache: "no-store" }),
      fetch("/api/categories", { credentials: "include", cache: "no-store" }),
    ]);

    const productsPayload = (await productsResponse.json()) as
      | ApiSuccess<{ products: ProductView[] }>
      | ApiError;
    const brandsPayload = (await brandsResponse.json()) as
      | ApiSuccess<{ brands: ProductOptionView[] }>
      | ApiError;
    const categoriesPayload = (await categoriesResponse.json()) as
      | ApiSuccess<{ categories: ProductOptionView[] }>
      | ApiError;

    if (
      !productsResponse.ok ||
      productsPayload.status !== "success" ||
      !brandsResponse.ok ||
      brandsPayload.status !== "success" ||
      !categoriesResponse.ok ||
      categoriesPayload.status !== "success"
    ) {
      setError(
        productsPayload.message ||
          brandsPayload.message ||
          categoriesPayload.message ||
          "Failed to load product data.",
      );
      setIsLoading(false);
      return;
    }

    setProducts(productsPayload.data.products);
    setBrands(brandsPayload.data.brands);
    setCategories(categoriesPayload.data.categories);
    setIsLoading(false);
  }

  async function toggleProductStatus(product: ProductView) {
    const response = await fetch(`/api/products/${product.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    const payload = (await response.json()) as ApiSuccess<{ product: ProductView }> | ApiError;

    if (!response.ok || payload.status !== "success") {
      setError(payload.message || "Failed to update product status.");
      return;
    }

    setSuccessMessage(payload.message);
    await loadData();
  }

  async function toggleVariantStatus(variant: ProductVariantView) {
    const response = await fetch(`/api/product-variants/${variant.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !variant.isActive }),
    });
    const payload = (await response.json()) as ApiSuccess<{ variant: ProductVariantView }> | ApiError;

    if (!response.ok || payload.status !== "success") {
      setError(payload.message || "Failed to update variant status.");
      return;
    }

    setSuccessMessage(payload.message);
    await loadData();
  }

  async function handleDrawerSuccess(message: string) {
    setDrawer(null);
    setSuccessMessage(message);
    await loadData();
  }

  return (
    <div className="space-y-6">
      <ProductsPageHeader
        onRefresh={() => void loadData()}
        onAdd={() => setDrawer({ mode: "create" })}
      />

      {successMessage ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <ProductsList
        isLoading={isLoading}
        products={products}
        onEditProduct={(product) => setDrawer({ mode: "edit-product", product })}
        onToggleProductStatus={(product) => void toggleProductStatus(product)}
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
