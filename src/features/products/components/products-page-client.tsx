"use client";

import { useState } from "react";
import {
  useFieldArray,
  useForm,
  type FieldValues,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Power, RefreshCw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CrudDrawer } from "@/components/common/crud-drawer";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import {
  createProductSchema,
  updateProductSchema,
  updateProductVariantSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type UpdateProductVariantInput,
} from "@/features/products/schemas/product-schemas";

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
  productWeight: string | null;
  shippingWeight: string | null;
  isActive: boolean;
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

type ApiSuccess<T> = {
  status: "success";
  code: number;
  message: string;
  data: T;
};

type ApiError = {
  status: "error";
  code: number;
  message: string;
  data: unknown;
};

type DrawerState =
  | { mode: "create" }
  | { mode: "edit-product"; product: ProductView }
  | { mode: "edit-variant"; product: ProductView; variant: ProductVariantView }
  | null;

function defaultVariant() {
  return {
    name: "",
    sku: "",
    defaultSellingPrice: "",
    productWeight: "",
    shippingWeight: "",
    lowStockAlert: 0,
    isActive: true,
  };
}

function getProductOptions(
  options: ProductOptionView[],
  selectedId?: number | null,
) {
  return options.filter((option) => option.isActive || option.id === selectedId);
}

function ProductReferenceFields({
  register,
  brands,
  categories,
  selectedBrandId,
  selectedCategoryId,
}: {
  register: UseFormRegister<FieldValues>;
  brands: ProductOptionView[];
  categories: ProductOptionView[];
  selectedBrandId?: number | null;
  selectedCategoryId?: number | null;
}) {
  const selectableBrands = getProductOptions(brands, selectedBrandId);
  const selectableCategories = getProductOptions(categories, selectedCategoryId);

  return (
    <>
      <div className="space-y-2">
        <Label>Brand</Label>
        <select
          className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
          {...register("brandId")}
        >
          <option value="">No brand</option>
          {selectableBrands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
              {brand.isActive ? "" : " (Inactive)"}
            </option>
          ))}
        </select>
        {selectableBrands.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No active brands yet. Add one from Product Options.
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <select
          className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
          {...register("categoryId")}
        >
          <option value="">No category</option>
          {selectableCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.isActive ? "" : " (Inactive)"}
            </option>
          ))}
        </select>
        {selectableCategories.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No active categories yet. Add one from Product Options.
          </p>
        ) : null}
      </div>
    </>
  );
}

function ProductCreateForm({
  brands,
  categories,
  onSuccess,
}: {
  brands: ProductOptionView[];
  categories: ProductOptionView[];
  onSuccess: (message: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      brandId: null,
      categoryId: null,
      description: "",
      isActive: true,
      variants: [defaultVariant()],
    },
  });
  const variants = useFieldArray({ control: form.control, name: "variants" });

  async function onSubmit(values: CreateProductInput) {
    setSubmitError(null);
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as ApiSuccess<{ product: ProductView }> | ApiError;

    if (!response.ok || payload.status !== "success") {
      setSubmitError(payload.message || "Failed to create product.");
      return;
    }

    onSuccess(payload.message);
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
        </div>
        <ProductReferenceFields
          brands={brands}
          categories={categories}
          register={form.register as unknown as UseFormRegister<FieldValues>}
        />
        <div className="flex items-end gap-2">
          <input className="h-4 w-4" type="checkbox" {...form.register("isActive")} />
          <Label>Active</Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea {...form.register("description")} />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Variants</h3>
            <p className="text-sm text-muted-foreground">At least one variant is required.</p>
          </div>
          <Button
            className="w-auto px-4"
            onClick={() => variants.append(defaultVariant())}
            type="button"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        </div>
        <div className="space-y-4">
          {variants.fields.map((field, index) => (
            <div className="rounded-2xl border border-border bg-background/70 p-4" key={field.id}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Variant Name</Label>
                  <Input {...form.register(`variants.${index}.name`)} />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input {...form.register(`variants.${index}.sku`)} />
                </div>
                <div className="space-y-2">
                  <Label>Default Selling Price</Label>
                  <Input {...form.register(`variants.${index}.defaultSellingPrice`)} />
                </div>
                <div className="space-y-2">
                  <Label>Low Stock Alert</Label>
                  <Input
                    type="number"
                    {...form.register(`variants.${index}.lowStockAlert`, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Weight</Label>
                  <Input {...form.register(`variants.${index}.productWeight`)} />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Weight</Label>
                  <Input {...form.register(`variants.${index}.shippingWeight`)} />
                </div>
                <div className="flex items-end gap-2">
                  <input
                    className="h-4 w-4"
                    type="checkbox"
                    {...form.register(`variants.${index}.isActive`)}
                  />
                  <Label>Active</Label>
                </div>
              </div>
              {variants.fields.length > 1 ? (
                <Button
                  className="mt-4 w-auto px-4"
                  onClick={() => variants.remove(index)}
                  type="button"
                  variant="outline"
                >
                  Remove Variant
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving..." : "Create Product"}
      </Button>
    </form>
  );
}

function ProductEditForm({
  product,
  brands,
  categories,
  onSuccess,
}: {
  product: ProductView;
  brands: ProductOptionView[];
  categories: ProductOptionView[];
  onSuccess: (message: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: product.name,
      brandId: product.brandId,
      categoryId: product.categoryId,
      description: product.description ?? "",
      isActive: product.isActive,
    },
  });

  async function onSubmit(values: UpdateProductInput) {
    setSubmitError(null);
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as ApiSuccess<{ product: ProductView }> | ApiError;

    if (!response.ok || payload.status !== "success") {
      setSubmitError(payload.message || "Failed to update product.");
      return;
    }

    onSuccess(payload.message);
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
        </div>
        <ProductReferenceFields
          brands={brands}
          categories={categories}
          register={form.register as unknown as UseFormRegister<FieldValues>}
          selectedBrandId={product.brandId}
          selectedCategoryId={product.categoryId}
        />
        <div className="flex items-end gap-2">
          <input className="h-4 w-4" type="checkbox" {...form.register("isActive")} />
          <Label>Active</Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea {...form.register("description")} />
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving..." : "Save Product"}
      </Button>
    </form>
  );
}

function VariantEditForm({
  variant,
  onSuccess,
}: {
  variant: ProductVariantView;
  onSuccess: (message: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(updateProductVariantSchema),
    defaultValues: {
      name: variant.name,
      sku: variant.sku ?? "",
      defaultSellingPrice: variant.defaultSellingPrice ?? "",
      productWeight: variant.productWeight ?? "",
      shippingWeight: variant.shippingWeight ?? "",
      lowStockAlert: variant.lowStockAlert ?? 0,
      isActive: variant.isActive,
    },
  });

  async function onSubmit(values: UpdateProductVariantInput) {
    setSubmitError(null);
    const response = await fetch(`/api/product-variants/${variant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as ApiSuccess<{ variant: ProductVariantView }> | ApiError;

    if (!response.ok || payload.status !== "success") {
      setSubmitError(payload.message || "Failed to update product variant.");
      return;
    }

    onSuccess(payload.message);
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label>SKU</Label>
          <Input {...form.register("sku")} />
        </div>
        <div className="space-y-2">
          <Label>Default Selling Price</Label>
          <Input {...form.register("defaultSellingPrice")} />
        </div>
        <div className="space-y-2">
          <Label>Low Stock Alert</Label>
          <Input type="number" {...form.register("lowStockAlert", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label>Product Weight</Label>
          <Input {...form.register("productWeight")} />
        </div>
        <div className="space-y-2">
          <Label>Shipping Weight</Label>
          <Input {...form.register("shippingWeight")} />
        </div>
        <div className="space-y-2">
          <Label>Current Stock</Label>
          <Input readOnly value={variant.currentStock} />
        </div>
        <div className="flex items-end gap-2">
          <input className="h-4 w-4" type="checkbox" {...form.register("isActive")} />
          <Label>Active</Label>
        </div>
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving..." : "Save Variant"}
      </Button>
    </form>
  );
}

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
      <PageHeader
        title="Products"
        description="Manage catalog products and variants with predefined brands and categories. Stock remains read-only and starts at 0."
        actions={
          <>
            <Button className="w-auto px-4" onClick={() => void loadData()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button className="w-auto px-4" onClick={() => setDrawer({ mode: "create" })}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </>
        }
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

      {isLoading ? (
        <>
          <TableSkeleton columns={5} rows={6} />
          <CardListSkeleton cards={4} />
        </>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="pt-8">
            <p className="text-sm text-muted-foreground">
              No products yet. Click Add Product to create your first catalog item.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.9fr] gap-4 border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground">
              <div>Product</div>
              <div>Brand / Category</div>
              <div>Variants</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-border">
              {products.map((product) => (
                <div className="px-6 py-5" key={product.id}>
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.9fr] gap-4">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.description || "No description"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{product.brand?.name || "No brand"}</p>
                      <p className="mt-1">{product.category?.name || "No category"}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {product.variants.map((variant) => (
                        <div className="mb-2" key={variant.id}>
                          <p className="font-medium text-foreground">{variant.name}</p>
                          <p>Stock: {variant.currentStock}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-auto px-4" onClick={() => setDrawer({ mode: "edit-product", product })} variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Product
                      </Button>
                      <Button className="w-auto px-4" onClick={() => void toggleProductStatus(product)} variant="outline">
                        <Power className="mr-2 h-4 w-4" />
                        {product.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {product.variants.map((variant) => (
                      <div className="rounded-2xl border border-border bg-background/70 p-4" key={variant.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{variant.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">SKU: {variant.sku || "Not set"}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${variant.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                            {variant.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <p>Current stock: {variant.currentStock}</p>
                          <p>Low stock alert: {variant.lowStockAlert ?? "Not set"}</p>
                          <p>Default price: {variant.defaultSellingPrice ?? "Not set"}</p>
                          <p>Product weight: {variant.productWeight ?? "Not set"}</p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            className="w-auto px-4"
                            onClick={() => setDrawer({ mode: "edit-variant", product, variant })}
                            variant="outline"
                          >
                            Edit Variant
                          </Button>
                          <Button
                            className="w-auto px-4"
                            onClick={() => void toggleVariantStatus(variant)}
                            variant="outline"
                          >
                            {variant.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:hidden">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[product.brand?.name, product.category?.name].filter(Boolean).join(" · ") ||
                          "No brand/category"}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {product.description || "No description"}
                  </p>
                  <div className="mt-4 space-y-3">
                    {product.variants.map((variant) => (
                      <div className="rounded-2xl border border-border bg-background/70 p-4" key={variant.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{variant.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Stock: {variant.currentStock}</p>
                          </div>
                          <Button
                            className="w-auto px-4"
                            onClick={() => setDrawer({ mode: "edit-variant", product, variant })}
                            variant="outline"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button className="w-auto px-4" onClick={() => setDrawer({ mode: "edit-product", product })} variant="outline">
                      Edit Product
                    </Button>
                    <Button className="w-auto px-4" onClick={() => void toggleProductStatus(product)} variant="outline">
                      {product.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <CrudDrawer
        description={
          drawer?.mode === "create"
            ? "Create a new product with one or more variants."
            : drawer?.mode === "edit-product"
              ? "Update master product details."
              : drawer?.mode === "edit-variant"
                ? "Update variant details. Current stock is read-only."
                : undefined
        }
        onClose={() => setDrawer(null)}
        open={drawer !== null}
        title={
          drawer?.mode === "create"
            ? "Add Product"
            : drawer?.mode === "edit-product"
              ? "Edit Product"
              : drawer?.mode === "edit-variant"
                ? "Edit Variant"
                : ""
        }
      >
        {drawer?.mode === "create" ? (
          <ProductCreateForm
            brands={brands}
            categories={categories}
            onSuccess={handleDrawerSuccess}
          />
        ) : null}
        {drawer?.mode === "edit-product" ? (
          <ProductEditForm
            brands={brands}
            categories={categories}
            onSuccess={handleDrawerSuccess}
            product={drawer.product}
          />
        ) : null}
        {drawer?.mode === "edit-variant" ? (
          <VariantEditForm onSuccess={handleDrawerSuccess} variant={drawer.variant} />
        ) : null}
      </CrudDrawer>
    </div>
  );
}
