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
  createVariantImageState,
  ProductVariantImageField,
  validateVariantImageFile,
  type VariantImageState,
} from "./product-variant-image-field";
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
import { type ProductOptionView, type ProductView, type ProductVariantView } from "../types/product";

const fieldLabelClassName = "text-xs font-medium text-muted-foreground";
const fieldInputClassName = "h-11 rounded-xl border-border/80 shadow-none";
const fieldSelectClassName =
  "flex h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-none outline-none transition focus-visible:ring-2 focus-visible:ring-ring";

async function uploadVariantImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/product-variant-images", {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  if (!response.ok || result.status === "error") {
    throw new Error(result.message || "Failed to upload image.");
  }

  return result.data as { imagePath: string; imageUrl: string };
}

function ActiveToggle({
  register,
  name,
}: {
  register: UseFormRegister<FieldValues>;
  name: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/10 px-3 py-2.5">
      <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <input className="h-4 w-4 rounded border-border" type="checkbox" {...register(name)} />
        Active
      </Label>
    </div>
  );
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
        <Label className={fieldLabelClassName}>Brand</Label>
        <select
          className={fieldSelectClassName}
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
        <Label className={fieldLabelClassName}>Category</Label>
        <select
          className={fieldSelectClassName}
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
  const [imageStates, setImageStates] = useState<VariantImageState[]>([
    createVariantImageState(),
  ]);
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

  function handleVariantAppend() {
    variants.append(defaultVariant());
    setImageStates((prev) => [...prev, createVariantImageState()]);
  }

  function handleVariantRemove(index: number) {
    variants.remove(index);
    setImageStates((prev) => prev.filter((_, stateIndex) => stateIndex !== index));
  }

  function handleImageSelect(index: number, file: File) {
    const validationError = validateVariantImageFile(file);
    setImageStates((prev) =>
      prev.map((state, stateIndex) =>
        stateIndex === index
          ? {
              ...state,
              file: validationError ? null : file,
              previewUrl: null,
              isRemoved: false,
              error: validationError,
            }
          : state,
      ),
    );
  }

  function handleImageRemove(index: number) {
    form.setValue(`variants.${index}.imagePath`, null);
    form.setValue(`variants.${index}.imageUrl`, null);
    setImageStates((prev) =>
      prev.map((state, stateIndex) =>
        stateIndex === index
          ? { ...state, file: null, previewUrl: null, isRemoved: true, error: null }
          : state,
      ),
    );
  }

  async function onSubmit(values: CreateProductInput) {
    setSubmitError(null);
    try {
      if (imageStates.some((state) => state.error)) {
        throw new Error("Please fix variant image errors before saving.");
      }

      const variantsWithImages = await Promise.all(
        values.variants.map(async (variant, index) => {
          const imageState = imageStates[index];

          if (imageState?.file) {
            const image = await uploadVariantImage(imageState.file);
            return {
              ...variant,
              imagePath: image.imagePath,
              imageUrl: image.imageUrl,
            };
          }

          if (imageState?.isRemoved) {
            return { ...variant, imagePath: null, imageUrl: null };
          }

          return variant;
        }),
      );
      const result = await apiClient<{ product: ProductView }>("/api/products", {
        method: "POST",
        body: JSON.stringify({ ...values, variants: variantsWithImages }),
        showSuccessToast: true,
      });
      onSuccess(result ? "Product created successfully" : "");
    } catch (error: any) {
      setSubmitError(error.message);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="rounded-2xl border border-border/70 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.045)] sm:p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold tracking-tight text-foreground">Product Basics</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Set the main identity before adding variants.</p>
        </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4">
        <div className="col-span-2 space-y-2">
          <Label className={fieldLabelClassName}>Name</Label>
          <Input className={fieldInputClassName} {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message as string}</p>
          )}
        </div>
        <ProductReferenceFields
          brands={brands}
          categories={categories}
          register={form.register as unknown as UseFormRegister<FieldValues>}
        />
        <ActiveToggle
          name="isActive"
          register={form.register as unknown as UseFormRegister<FieldValues>}
        />
      </div>
      <div className="col-span-2 space-y-2">
        <Label className={fieldLabelClassName}>Description</Label>
        <Textarea
          className="min-h-[88px] rounded-xl border-border/80 shadow-none"
          {...form.register("description")}
        />
      </div>
      </div>
      <ProductVariantFields
        variants={variants}
        register={form.register as unknown as UseFormRegister<any>}
        imageStates={imageStates}
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
        onVariantAppend={handleVariantAppend}
        onVariantRemove={handleVariantRemove}
      />
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button className="h-11 w-full rounded-xl text-sm sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4">
        <div className="col-span-2 space-y-2">
          <Label className={fieldLabelClassName}>Name</Label>
          <Input className={fieldInputClassName} {...form.register("name")} />
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
        <ActiveToggle
          name="isActive"
          register={form.register as unknown as UseFormRegister<FieldValues>}
        />
      </div>
      <div className="col-span-2 space-y-2">
        <Label className={fieldLabelClassName}>Description</Label>
        <Textarea className="min-h-[88px] rounded-xl border-border/80 shadow-none" {...form.register("description")} />
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button className="h-11 w-full rounded-xl text-sm sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
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
  const [imageState, setImageState] = useState<VariantImageState>(
    createVariantImageState(),
  );
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
      imagePath: null,
      imageUrl: null,
      imageAltText: null,
    },
  });

  function handleImageSelect(file: File) {
    const validationError = validateVariantImageFile(file);
    setImageState((state) => ({
      ...state,
      file: validationError ? null : file,
      previewUrl: null,
      isRemoved: false,
      error: validationError,
    }));
  }

  function handleImageRemove() {
    form.setValue("imagePath", null);
    form.setValue("imageUrl", null);
    setImageState((state) => ({
      ...state,
      file: null,
      previewUrl: null,
      isRemoved: true,
      error: null,
    }));
  }

  async function onSubmit(values: CreateProductVariantInput) {
    setSubmitError(null);
    try {
      if (imageState.error) {
        throw new Error("Please fix variant image errors before saving.");
      }

      let payload: CreateProductVariantInput = values;
      if (imageState.file) {
        const image = await uploadVariantImage(imageState.file);
        payload = {
          ...values,
          imagePath: image.imagePath,
          imageUrl: image.imageUrl,
        };
      } else if (imageState.isRemoved) {
        payload = { ...values, imagePath: null, imageUrl: null };
      }

      const result = await apiClient<{ variant: ProductVariantView }>(`/api/products/${product.id}/variants`, {
        method: "POST",
        body: JSON.stringify(payload),
        showSuccessToast: true,
      });
      onSuccess(result ? "Variant created successfully" : "");
    } catch (error: any) {
      setSubmitError(error.message);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4">
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>Name</Label>
          <Input className={fieldInputClassName} {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message as string}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>SKU</Label>
          <Input className={fieldInputClassName} {...form.register("sku")} />
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>Default Selling Price</Label>
          <Input className={fieldInputClassName} {...form.register("defaultSellingPrice")} />
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>Low Stock Alert</Label>
          <Input className={fieldInputClassName} type="number" {...form.register("lowStockAlert", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>Product Size</Label>
          <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
            <Input className={fieldInputClassName} placeholder="e.g. 250" {...form.register("productSizeValue")} />
            <select
              className={fieldSelectClassName}
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
          <Label className={fieldLabelClassName}>Shipping Weight (kg)</Label>
          <Input className={fieldInputClassName} placeholder="e.g. 0.35" {...form.register("shippingWeightKg")} />
          <p className="text-[10px] text-muted-foreground">Cargo chargeable weight in kg</p>
        </div>
        <ActiveToggle
          name="isActive"
          register={form.register as unknown as UseFormRegister<FieldValues>}
        />
        <input type="hidden" {...form.register("imagePath")} />
        <input type="hidden" {...form.register("imageUrl")} />
        <input type="hidden" {...form.register("imageAltText")} />
        <ProductVariantImageField
          id="variant-create-image"
          state={imageState}
          onSelect={handleImageSelect}
          onRemove={handleImageRemove}
        />
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button className="h-11 w-full rounded-xl text-sm sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
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
  const [imageState, setImageState] = useState<VariantImageState>(
    createVariantImageState(variant.imageUrl),
  );
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
      imagePath: variant.imagePath,
      imageUrl: variant.imageUrl,
      imageAltText: variant.imageAltText,
    },
  });

  function handleImageSelect(file: File) {
    const validationError = validateVariantImageFile(file);
    setImageState((state) => ({
      ...state,
      file: validationError ? null : file,
      previewUrl: null,
      isRemoved: false,
      error: validationError,
    }));
  }

  function handleImageRemove() {
    form.setValue("imagePath", null);
    form.setValue("imageUrl", null);
    setImageState((state) => ({
      ...state,
      file: null,
      previewUrl: null,
      isRemoved: true,
      error: null,
    }));
  }

  async function onSubmit(values: UpdateProductVariantInput) {
    setSubmitError(null);
    try {
      if (imageState.error) {
        throw new Error("Please fix variant image errors before saving.");
      }

      let payload: UpdateProductVariantInput = values;
      if (imageState.file) {
        const image = await uploadVariantImage(imageState.file);
        payload = {
          ...values,
          imagePath: image.imagePath,
          imageUrl: image.imageUrl,
        };
      } else if (imageState.isRemoved) {
        payload = { ...values, imagePath: null, imageUrl: null };
      }

      const result = await apiClient<{ variant: ProductVariantView }>(`/api/product-variants/${variant.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        showSuccessToast: true,
      });
      onSuccess(result ? "Variant updated successfully" : "");
    } catch (error: any) {
      setSubmitError(error.message);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4">
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>Name</Label>
          <Input className={fieldInputClassName} {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message as string}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>SKU</Label>
          <Input className={fieldInputClassName} {...form.register("sku")} />
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>Default Selling Price</Label>
          <Input className={fieldInputClassName} {...form.register("defaultSellingPrice")} />
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>Low Stock Alert</Label>
          <Input className={fieldInputClassName} type="number" {...form.register("lowStockAlert", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>Product Size</Label>
          <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
            <Input className={fieldInputClassName} placeholder="e.g. 250" {...form.register("productSizeValue")} />
            <select
              className={fieldSelectClassName}
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
          <Label className={fieldLabelClassName}>Shipping Weight (kg)</Label>
          <Input className={fieldInputClassName} placeholder="e.g. 0.35" {...form.register("shippingWeightKg")} />
          <p className="text-[10px] text-muted-foreground">Cargo chargeable weight in kg</p>
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClassName}>Current Stock</Label>
          <Input className={fieldInputClassName} readOnly value={variant.currentStock} />
        </div>
        <ActiveToggle
          name="isActive"
          register={form.register as unknown as UseFormRegister<FieldValues>}
        />
        <input type="hidden" {...form.register("imagePath")} />
        <input type="hidden" {...form.register("imageUrl")} />
        <input type="hidden" {...form.register("imageAltText")} />
        <ProductVariantImageField
          id={`variant-edit-image-${variant.id}`}
          state={imageState}
          onSelect={handleImageSelect}
          onRemove={handleImageRemove}
        />
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button className="h-11 w-full rounded-xl text-sm sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving..." : "Save Variant"}
      </Button>
    </form>
  );
}
