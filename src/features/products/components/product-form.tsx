import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useForm, useFieldArray, type UseFormRegister, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ProductVariantFields, defaultVariant } from "./product-variant-fields";
import {
  createProductSchema,
  updateProductSchema,
  updateProductVariantSchema,
  productVariantSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type UpdateProductVariantInput,
  type CreateProductVariantInput,
} from "@/features/products/schemas/product-schemas";
import { type ProductOptionView, type ProductView, type ProductVariantView, type ApiSuccess, type ApiError } from "../types/product";

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

export function ProductCreateForm({
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
    try {
      const result = await apiClient<{ product: ProductView }>("/api/products", {
        method: "POST",
        body: JSON.stringify(values),
        showSuccessToast: true,
      });
      onSuccess(result ? "Product created successfully" : "");
    } catch (error: any) {
      setSubmitError(error.message);
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message as string}</p>
          )}
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
      <ProductVariantFields variants={variants} register={form.register as unknown as UseFormRegister<any>} />
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving..." : "Create Product"}
      </Button>
    </form>
  );
}

export function ProductEditForm({
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
    try {
      const result = await apiClient<{ product: ProductView }>(`/api/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
        showSuccessToast: true,
      });
      onSuccess(result ? "Product updated successfully" : "");
    } catch (error: any) {
      setSubmitError(error.message);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message as string}</p>
          )}
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

export function VariantCreateForm({
  product,
  onSuccess,
}: {
  product: ProductView;
  onSuccess: (message: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(productVariantSchema),
    defaultValues: {
      name: "",
      sku: "",
      defaultSellingPrice: "",
      productSizeValue: "",
      productSizeUnit: "" as const,
      shippingWeightKg: "",
      lowStockAlert: 0,
      isActive: true,
    },
  });

  async function onSubmit(values: CreateProductVariantInput) {
    setSubmitError(null);
    try {
      const result = await apiClient<{ variant: ProductVariantView }>(`/api/products/${product.id}/variants`, {
        method: "POST",
        body: JSON.stringify(values),
        showSuccessToast: true,
      });
      onSuccess(result ? "Variant created successfully" : "");
    } catch (error: any) {
      setSubmitError(error.message);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message as string}</p>
          )}
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
          <Label>Product Size</Label>
          <div className="flex gap-2">
            <Input placeholder="e.g. 250" {...form.register("productSizeValue")} />
            <select
              className="flex h-11 w-24 rounded-xl border border-border bg-white px-3 text-sm"
              {...form.register("productSizeUnit")}
            >
              <option value="">Unit</option>
              <option value="ML">ML</option>
              <option value="G">G</option>
              <option value="KG">KG</option>
              <option value="PCS">PCS</option>
              <option value="SET">SET</option>
            </select>
          </div>
          <p className="text-[10px] text-muted-foreground">Example: 250 ML or 50 G</p>
        </div>
        <div className="space-y-2">
          <Label>Shipping Weight (kg)</Label>
          <Input placeholder="e.g. 0.35" {...form.register("shippingWeightKg")} />
          <p className="text-[10px] text-muted-foreground">Cargo chargeable weight in kg</p>
        </div>
        <div className="flex items-end gap-2">
          <input className="h-4 w-4" type="checkbox" {...form.register("isActive")} />
          <Label>Active</Label>
        </div>
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Adding..." : "Add Variant"}
      </Button>
    </form>
  );
}

export function VariantEditForm({
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
      productSizeValue: variant.productSizeValue ?? "",
      productSizeUnit: variant.productSizeUnit ?? "",
      shippingWeightKg: variant.shippingWeightKg ?? "",
      lowStockAlert: variant.lowStockAlert ?? 0,
      isActive: variant.isActive,
    },
  });

  async function onSubmit(values: UpdateProductVariantInput) {
    setSubmitError(null);
    try {
      const result = await apiClient<{ variant: ProductVariantView }>(`/api/product-variants/${variant.id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
        showSuccessToast: true,
      });
      onSuccess(result ? "Variant updated successfully" : "");
    } catch (error: any) {
      setSubmitError(error.message);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message as string}</p>
          )}
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
          <Label>Product Size</Label>
          <div className="flex gap-2">
            <Input placeholder="e.g. 250" {...form.register("productSizeValue")} />
            <select
              className="flex h-11 w-24 rounded-xl border border-border bg-white px-3 text-sm"
              {...form.register("productSizeUnit")}
            >
              <option value="">Unit</option>
              <option value="ML">ML</option>
              <option value="G">G</option>
              <option value="KG">KG</option>
              <option value="PCS">PCS</option>
              <option value="SET">SET</option>
            </select>
          </div>
          <p className="text-[10px] text-muted-foreground">Example: 250 ML or 50 G</p>
        </div>
        <div className="space-y-2">
          <Label>Shipping Weight (kg)</Label>
          <Input placeholder="e.g. 0.35" {...form.register("shippingWeightKg")} />
          <p className="text-[10px] text-muted-foreground">Cargo chargeable weight in kg</p>
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
