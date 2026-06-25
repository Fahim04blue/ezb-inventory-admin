"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import {
  createCategorySchema,
  type CreateCategoryInput,
} from "@/features/categories/schemas/category-schemas";
import type { ProductOptionItemView } from "../types/product-options";

export function CategoryForm({
  mode,
  category,
  onSuccess,
}: {
  mode: "create" | "edit";
  category?: ProductOptionItemView;
  onSuccess: (message: string) => void;
}) {
  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      isActive: category?.isActive ?? true,
    },
  });

  async function onSubmit(values: CreateCategoryInput) {
    const data = await apiClient<{ category: ProductOptionItemView }>(
      mode === "create" ? "/api/categories" : `/api/categories/${category?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        body: JSON.stringify(values),
        showErrorToast: true,
        showSuccessToast: false,
      },
    );

    onSuccess(data.category.name);
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="category-name">Name</Label>
        <Input id="category-name" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category-description">Description</Label>
        <Textarea id="category-description" {...form.register("description")} />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input className="h-4 w-4" type="checkbox" {...form.register("isActive")} />
        Active
      </label>
      <Button
        className="h-9 w-auto bg-[#1f5c4d] px-4 hover:bg-[#18493d]"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        {form.formState.isSubmitting
          ? "Saving..."
          : mode === "create"
            ? "Create Category"
            : "Save Category"}
      </Button>
    </form>
  );
}
