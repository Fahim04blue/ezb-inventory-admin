"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import {
  createBrandSchema,
  type CreateBrandFormInput,
} from "@/features/brands/schemas/brand-schemas";
import type { ProductOptionItemView } from "../types/product-options";

export function BrandForm({
  mode,
  brand,
  onSuccess,
}: {
  mode: "create" | "edit";
  brand?: ProductOptionItemView;
  onSuccess: (message: string) => void;
}) {
  const form = useForm<CreateBrandFormInput>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: brand?.name ?? "",
      description: brand?.description ?? "",
      isActive: brand?.isActive ?? true,
    },
  });

  async function onSubmit(values: CreateBrandFormInput) {
    const data = await apiClient<{ brand: ProductOptionItemView }>(
      mode === "create" ? "/api/brands" : `/api/brands/${brand?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        body: JSON.stringify(values),
        showErrorToast: true,
        showSuccessToast: false,
      },
    );

    onSuccess(data.brand.name);
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="brand-name">Name</Label>
        <Input id="brand-name" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="brand-description">Description</Label>
        <Textarea id="brand-description" {...form.register("description")} />
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
            ? "Create Brand"
            : "Save Brand"}
      </Button>
    </form>
  );
}
