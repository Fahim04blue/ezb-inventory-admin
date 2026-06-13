"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Power, RefreshCw, Shapes, Tags } from "lucide-react";
import { useForm } from "react-hook-form";

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
  createBrandSchema,
  type CreateBrandInput,
} from "@/features/brands/schemas/brand-schemas";
import {
  createCategorySchema,
  type CreateCategoryInput,
} from "@/features/categories/schemas/category-schemas";

export type ProductOptionItemView = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
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
  | { entity: "brand"; mode: "create" }
  | { entity: "brand"; mode: "edit"; item: ProductOptionItemView }
  | { entity: "category"; mode: "create" }
  | { entity: "category"; mode: "edit"; item: ProductOptionItemView }
  | null;

function BrandForm({
  mode,
  brand,
  onSuccess,
}: {
  mode: "create" | "edit";
  brand?: ProductOptionItemView;
  onSuccess: (message: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: brand?.name ?? "",
      description: brand?.description ?? "",
      isActive: brand?.isActive ?? true,
    },
  });

  async function onSubmit(values: CreateBrandInput) {
    setSubmitError(null);
    const response = await fetch(mode === "create" ? "/api/brands" : `/api/brands/${brand?.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as ApiSuccess<{ brand: ProductOptionItemView }> | ApiError;

    if (!response.ok || payload.status !== "success") {
      setSubmitError(payload.message || "Failed to save brand.");
      return;
    }

    onSuccess(payload.message);
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...form.register("name")} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea {...form.register("description")} />
      </div>
      <div className="flex items-end gap-2">
        <input className="h-4 w-4" type="checkbox" {...form.register("isActive")} />
        <Label>Active</Label>
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving..." : mode === "create" ? "Create Brand" : "Save Brand"}
      </Button>
    </form>
  );
}

function CategoryForm({
  mode,
  category,
  onSuccess,
}: {
  mode: "create" | "edit";
  category?: ProductOptionItemView;
  onSuccess: (message: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      isActive: category?.isActive ?? true,
    },
  });

  async function onSubmit(values: CreateCategoryInput) {
    setSubmitError(null);
    const response = await fetch(
      mode === "create" ? "/api/categories" : `/api/categories/${category?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      },
    );
    const payload = (await response.json()) as
      | ApiSuccess<{ category: ProductOptionItemView }>
      | ApiError;

    if (!response.ok || payload.status !== "success") {
      setSubmitError(payload.message || "Failed to save category.");
      return;
    }

    onSuccess(payload.message);
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...form.register("name")} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea {...form.register("description")} />
      </div>
      <div className="flex items-end gap-2">
        <input className="h-4 w-4" type="checkbox" {...form.register("isActive")} />
        <Label>Active</Label>
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting
          ? "Saving..."
          : mode === "create"
            ? "Create Category"
            : "Save Category"}
      </Button>
    </form>
  );
}

function ProductOptionsSection({
  title,
  singularLabel,
  description,
  icon,
  items,
  isLoading,
  onAdd,
  onEdit,
  onToggleStatus,
}: {
  title: string;
  singularLabel: string;
  description: string;
  icon: React.ReactNode;
  items: ProductOptionItemView[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: ProductOptionItemView) => void;
  onToggleStatus: (item: ProductOptionItemView) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-border bg-background p-3">{icon}</div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
            <Button className="w-auto px-4" onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
            Add {singularLabel}
          </Button>
        </div>

        {isLoading ? (
          <>
            <TableSkeleton columns={4} rows={5} />
            <CardListSkeleton cards={3} />
          </>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/60 px-4 py-6 text-sm text-muted-foreground">
            No {title.toLowerCase()} yet. Use the Add button to create the first one.
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
              <div className="grid grid-cols-[1.2fr_1.8fr_0.8fr_0.9fr] gap-4 border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground">
                <div>Name</div>
                <div>Description</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div className="grid grid-cols-[1.2fr_1.8fr_0.8fr_0.9fr] gap-4 px-6 py-5" key={item.id}>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.description || "No description"}</div>
                    <div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-auto px-4" onClick={() => onEdit(item)} variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button className="w-auto px-4" onClick={() => onToggleStatus(item)} variant="outline">
                        <Power className="mr-2 h-4 w-4" />
                        {item.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:hidden">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {item.description || "No description"}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button className="w-auto px-4" onClick={() => onEdit(item)} variant="outline">
                        Edit
                      </Button>
                      <Button className="w-auto px-4" onClick={() => onToggleStatus(item)} variant="outline">
                        {item.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductOptionsPageClient({
  initialBrands,
  initialCategories,
}: {
  initialBrands: ProductOptionItemView[];
  initialCategories: ProductOptionItemView[];
}) {
  const [brands, setBrands] = useState<ProductOptionItemView[]>(initialBrands);
  const [categories, setCategories] = useState<ProductOptionItemView[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    const [brandsResponse, categoriesResponse] = await Promise.all([
      fetch("/api/brands", { credentials: "include", cache: "no-store" }),
      fetch("/api/categories", { credentials: "include", cache: "no-store" }),
    ]);

    const brandsPayload = (await brandsResponse.json()) as
      | ApiSuccess<{ brands: ProductOptionItemView[] }>
      | ApiError;
    const categoriesPayload = (await categoriesResponse.json()) as
      | ApiSuccess<{ categories: ProductOptionItemView[] }>
      | ApiError;

    if (
      !brandsResponse.ok ||
      brandsPayload.status !== "success" ||
      !categoriesResponse.ok ||
      categoriesPayload.status !== "success"
    ) {
      setError(brandsPayload.message || categoriesPayload.message || "Failed to load product options.");
      setIsLoading(false);
      return;
    }

    setBrands(brandsPayload.data.brands);
    setCategories(categoriesPayload.data.categories);
    setIsLoading(false);
  }

  async function toggleBrandStatus(brand: ProductOptionItemView) {
    const response = await fetch(`/api/brands/${brand.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !brand.isActive }),
    });
    const payload = (await response.json()) as ApiSuccess<{ brand: ProductOptionItemView }> | ApiError;

    if (!response.ok || payload.status !== "success") {
      setError(payload.message || "Failed to update brand status.");
      return;
    }

    setSuccessMessage(payload.message);
    await loadData();
  }

  async function toggleCategoryStatus(category: ProductOptionItemView) {
    const response = await fetch(`/api/categories/${category.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !category.isActive }),
    });
    const payload = (await response.json()) as
      | ApiSuccess<{ category: ProductOptionItemView }>
      | ApiError;

    if (!response.ok || payload.status !== "success") {
      setError(payload.message || "Failed to update category status.");
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
        title="Product Options"
        description="Manage predefined brands and categories so products use clean selectable options instead of free text."
        actions={
          <Button className="w-auto px-4" onClick={() => void loadData()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
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

      <ProductOptionsSection
        description="Brands are reusable product labels shown in product dropdowns."
        icon={<Tags className="h-5 w-5" />}
        isLoading={isLoading}
        items={brands}
        onAdd={() => setDrawer({ entity: "brand", mode: "create" })}
        onEdit={(item) => setDrawer({ entity: "brand", mode: "edit", item })}
        onToggleStatus={(item) => void toggleBrandStatus(item)}
        singularLabel="Brand"
        title="Brands"
      />

      <ProductOptionsSection
        description="Categories organize products into clean predefined groups."
        icon={<Shapes className="h-5 w-5" />}
        isLoading={isLoading}
        items={categories}
        onAdd={() => setDrawer({ entity: "category", mode: "create" })}
        onEdit={(item) => setDrawer({ entity: "category", mode: "edit", item })}
        onToggleStatus={(item) => void toggleCategoryStatus(item)}
        singularLabel="Category"
        title="Categories"
      />

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
