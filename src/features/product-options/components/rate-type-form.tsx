"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import {
  createRateTypeSchema,
  type CreateRateTypeInput,
} from "@/features/rate-types/schemas/rate-type-schemas";
import type { RateTypeView } from "@/features/rate-types/types/rate-type";

export function RateTypeForm({
  mode,
  rateType,
  onSuccess,
}: {
  mode: "create" | "edit";
  rateType?: RateTypeView;
  onSuccess: (message: string) => void;
}) {
  const form = useForm<CreateRateTypeInput>({
    resolver: zodResolver(createRateTypeSchema),
    defaultValues: {
      name: rateType?.name ?? "",
      code: rateType?.code ?? "",
      description: rateType?.description ?? "",
      isActive: rateType?.isActive ?? true,
    },
  });

  async function onSubmit(values: CreateRateTypeInput) {
    const data = await apiClient<{ rateType: RateTypeView }>(
      mode === "create" ? "/api/rate-types" : `/api/rate-types/${rateType?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        body: JSON.stringify(values),
        showErrorToast: true,
        showSuccessToast: false,
      },
    );

    onSuccess(data.rateType.name);
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="rate-type-name">Name</Label>
        <Input id="rate-type-name" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="rate-type-code">Code</Label>
        <Input
          id="rate-type-code"
          {...form.register("code")}
          onChange={(event) => {
            form.setValue("code", event.target.value.toUpperCase(), {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
        <p className="text-xs text-slate-500">Use uppercase snake case, for example CUSTOMER_SELLING.</p>
        {form.formState.errors.code ? (
          <p className="text-sm text-red-600">{form.formState.errors.code.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="rate-type-description">Description</Label>
        <Textarea id="rate-type-description" {...form.register("description")} />
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
            ? "Create Rate Type"
            : "Save Rate Type"}
      </Button>
    </form>
  );
}
