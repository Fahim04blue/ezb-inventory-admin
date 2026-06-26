import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Currency, CurrencyRateType } from "@/lib/domain-enums";
import { formatEnum } from "@/lib/formatters";
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
      isActive: true,
    },
  });

  async function onSubmit(values: CreateCurrencyRateInput) {
    setSubmitError(null);
    try {
      const result = await apiClient<{ currencyRate: CurrencyRateView }>(
        mode === "create" ? "/api/currency-rates" : `/api/currency-rates/${currencyRate?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          body: JSON.stringify({
            ...values,
            effectiveDate: values.effectiveDate instanceof Date ? values.effectiveDate.toISOString() : values.effectiveDate,
          }),
          showSuccessToast: true,
        }
      );
      onSuccess(result ? "Currency rate saved successfully" : "");
    } catch (error: any) {
      setSubmitError(error.message);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Currency / Unit</Label>
          <select className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm" {...form.register("currency")}>
            {Object.values(Currency).map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <select className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm" {...form.register("rateType")}>
            {Object.values(CurrencyRateType).map((rateType) => (
              <option key={rateType} value={rateType}>
                {formatEnum(rateType)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Rate to BDT</Label>
          <Input {...form.register("rateToBdt")} />
        </div>
        <div className="space-y-2">
          <Label>Effective From</Label>
          <Input type="date" {...form.register("effectiveDate", { valueAsDate: true })} />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input {...form.register("country")} />
        </div>
        <div className="space-y-2">
          <Label>Rate Name</Label>
          <Input placeholder="e.g. SHEIN Actual Card Rate" {...form.register("source")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea {...form.register("note")} />
      </div>
      <div className="flex items-end gap-2">
        <input className="h-4 w-4" type="checkbox" {...form.register("isActive")} />
        <Label>Set as Current</Label>
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting
          ? "Saving..."
          : mode === "create"
            ? "Create Rate"
            : "Save Rate"}
      </Button>
    </form>
  );
}
