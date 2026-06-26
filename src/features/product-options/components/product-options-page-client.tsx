"use client";

import { useState } from "react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { CrudPageHeader } from "@/components/common/crud-page-header";
import { apiClient } from "@/lib/api-client";
import { BrandForm } from "./brand-form";
import { BrandsSection } from "./brands-section";
import { CategoriesSection } from "./categories-section";
import { CategoryForm } from "./category-form";
import { ProductOptionsTabs } from "./product-options-tabs";
import type {
  ProductOptionItemView,
  ProductOptionsDrawerState,
  ProductOptionsPageData,
  ProductOptionsTab,
} from "../types/product-options";

export function ProductOptionsPageClient({
  initialBrands,
  initialCategories,
}: {
  initialBrands: ProductOptionItemView[];
  initialCategories: ProductOptionItemView[];
}) {
  const [brands, setBrands] = useState(initialBrands);
  const [categories, setCategories] = useState(initialCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductOptionsTab>("brands");
  const [drawer, setDrawer] = useState<ProductOptionsDrawerState>(null);

  async function loadData() {
    setIsLoading(true);

    try {
      const data = await apiClient<ProductOptionsPageData>("/api/product-options", {
        cache: "no-store",
        showErrorToast: true,
      });

      setBrands(data.brands);
      setCategories(data.categories);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleBrandStatus(brand: ProductOptionItemView) {
    await apiClient<{ brand: ProductOptionItemView }>(`/api/brands/${brand.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !brand.isActive }),
      showSuccessToast: true,
    });
    await loadData();
  }

  async function toggleCategoryStatus(category: ProductOptionItemView) {
    await apiClient<{ category: ProductOptionItemView }>(`/api/categories/${category.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !category.isActive }),
      showSuccessToast: true,
    });
    await loadData();
  }

  async function handleDrawerSuccess() {
    setDrawer(null);
    await loadData();
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <CrudPageHeader
        title="Product Options"
        description="Manage reusable product brands and categories used across the catalog."
        isRefreshing={isLoading}
        onRefresh={() => void loadData()}
      />

      <ProductOptionsTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "brands" ? (
        <BrandsSection
          brands={brands}
          isLoading={isLoading}
          onAdd={() => setDrawer({ entity: "brand", mode: "create" })}
          onEdit={(item) => setDrawer({ entity: "brand", mode: "edit", item })}
          onToggleStatus={(item) => void toggleBrandStatus(item)}
        />
      ) : null}

      {activeTab === "categories" ? (
        <CategoriesSection
          categories={categories}
          isLoading={isLoading}
          onAdd={() => setDrawer({ entity: "category", mode: "create" })}
          onEdit={(item) => setDrawer({ entity: "category", mode: "edit", item })}
          onToggleStatus={(item) => void toggleCategoryStatus(item)}
        />
      ) : null}

      <CrudDrawer
        description={
          drawer?.entity === "brand"
            ? drawer.mode === "create"
              ? "Create a predefined brand option."
              : "Update a predefined brand option."
            : drawer?.entity === "category"
              ? drawer.mode === "create"
                ? "Create a predefined category option."
                : "Update a predefined category option."
              : undefined
        }
        onClose={() => setDrawer(null)}
        open={drawer !== null}
        title={
          drawer?.entity === "brand"
            ? drawer.mode === "create"
              ? "Add Brand"
              : "Edit Brand"
            : drawer?.entity === "category"
              ? drawer.mode === "create"
                ? "Add Category"
                : "Edit Category"
              : ""
        }
      >
        {drawer?.entity === "brand" ? (
          <BrandForm
            brand={drawer.mode === "edit" ? drawer.item : undefined}
            mode={drawer.mode}
            onSuccess={handleDrawerSuccess}
          />
        ) : null}
        {drawer?.entity === "category" ? (
          <CategoryForm
            category={drawer.mode === "edit" ? drawer.item : undefined}
            mode={drawer.mode}
            onSuccess={handleDrawerSuccess}
          />
        ) : null}
      </CrudDrawer>
    </div>
  );
}
