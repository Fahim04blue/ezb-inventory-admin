import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createSupplierSchema,
  type CreateSupplierInput,
} from "@/features/suppliers/schemas/supplier-schemas";
import { type SupplierView, type ApiSuccess, type ApiError } from "../types/supplier";

export function SupplierForm({
  mode,
  supplier,
  onSuccess,
}: {
  mode: "create" | "edit";
  supplier?: SupplierView;
  onSuccess: (message: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: supplier?.name ?? "",
      country: supplier?.country ?? "",
      contactInfo: supplier?.contactInfo ?? "",
      notes: supplier?.notes ?? "",
      isActive: supplier?.isActive ?? true,
    },
  });

  async function onSubmit(values: CreateSupplierInput) {
    setSubmitError(null);
    const response = await fetch(
      mode === "create" ? "/api/suppliers" : `/api/suppliers/${supplier?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      },
    );

    const payload = (await response.json()) as ApiSuccess<{ supplier: SupplierView }> | ApiError;

    if (!response.ok || payload.status !== "success") {
      setSubmitError(payload.message || "Failed to save supplier.");
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
          <Label>Country</Label>
          <Input {...form.register("country")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Contact Info</Label>
        <Textarea {...form.register("contactInfo")} />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea {...form.register("notes")} />
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
            ? "Create Supplier"
            : "Save Supplier"}
      </Button>
    </form>
  );
}
