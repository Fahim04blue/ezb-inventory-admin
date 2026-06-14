import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Currency, CurrencyRateType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCurrencyRateSchema,
  type CreateCurrencyRateInput,
} from "@/features/currency-rates/schemas/currency-rate-schemas";
import { type CurrencyRateView, type ApiSuccess, type ApiError } from "../types/currency-rate";

export function CurrencyRateForm({
  mode,
  currencyRate,
  onSuccess,
}: {
  mode: "create" | "edit";
  currencyRate?: CurrencyRateView;
  onSuccess: (message: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createCurrencyRateSchema),
    defaultValues: {
      currency: currencyRate?.currency ?? Currency.BDT,
      rateType: currencyRate?.rateType ?? CurrencyRateType.CARD_PURCHASE,
      rateToBdt: currencyRate?.rateToBdt ?? "",
      effectiveDate: currencyRate ? new Date(currencyRate.effectiveDate) : new Date(),
      country: currencyRate?.country ?? "",
      source: currencyRate?.source ?? "",
      note: currencyRate?.note ?? "",
      isActive: currencyRate?.isActive ?? true,
    },
  });

  async function onSubmit(values: CreateCurrencyRateInput) {
    setSubmitError(null);
    const response = await fetch(
      mode === "create"
        ? "/api/currency-rates"
        : `/api/currency-rates/${currencyRate?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...values,
          effectiveDate:
            values.effectiveDate instanceof Date
              ? values.effectiveDate.toISOString()
              : values.effectiveDate,
        }),
      },
    );

    const payload = (await response.json()) as
      | ApiSuccess<{ currencyRate: CurrencyRateView }>
      | ApiError;

    if (!response.ok || payload.status !== "success") {
      setSubmitError(payload.message || "Failed to save currency rate.");
      return;
    }

    onSuccess(payload.message);
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Currency</Label>
          <select className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm" {...form.register("currency")}>
            {Object.values(Currency).map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Rate Type</Label>
          <select className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm" {...form.register("rateType")}>
            {Object.values(CurrencyRateType).map((rateType) => (
              <option key={rateType} value={rateType}>
                {rateType}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Rate to BDT</Label>
          <Input {...form.register("rateToBdt")} />
        </div>
        <div className="space-y-2">
          <Label>Effective Date</Label>
          <Input type="date" {...form.register("effectiveDate", { valueAsDate: true })} />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input {...form.register("country")} />
        </div>
        <div className="space-y-2">
          <Label>Source</Label>
          <Input {...form.register("source")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Note</Label>
        <Textarea {...form.register("note")} />
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
            ? "Create Currency Rate"
            : "Save Currency Rate"}
      </Button>
    </form>
  );
}
