import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { type Resolver, useForm, useWatch } from "react-hook-form";

import { ProductVariantCombobox } from "@/features/purchases/components/product-variant-combobox";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { formatEnum } from "@/lib/formatters";
import {
  manualStockAdjustmentTypes,
  stockAdjustmentSchema,
  type StockAdjustmentInput,
} from "../schemas/stock-schemas";
import type {
  StockAdjustmentDrawerState,
  StockMovementView,
  StockVariantOption,
} from "../types/stock.types";

function getTodayDateInputValue() {
  return new Date().toISOString().split("T")[0];
}

export function StockAdjustmentForm({
  drawer,
  variantOptions,
  onSuccess,
}: {
  drawer: NonNullable<StockAdjustmentDrawerState>;
  variantOptions: StockVariantOption[];
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVariant = drawer.variant;
  const form = useForm<StockAdjustmentInput>({
    resolver: zodResolver(stockAdjustmentSchema) as unknown as Resolver<StockAdjustmentInput>,
    defaultValues: {
      variantId: selectedVariant?.id,
      adjustmentType: drawer.adjustmentType ?? "OPENING_STOCK",
      quantity: 1,
      unitCostBdt: selectedVariant?.currentLandedCost
        ? Number(selectedVariant.currentLandedCost)
        : undefined,
      reason: selectedVariant ? `Stock adjustment for ${selectedVariant.productName}` : "",
      date: new Date(),
    },
  });

  const adjustmentType = useWatch({
    control: form.control,
    name: "adjustmentType",
  });
  const selectedVariantId = useWatch({
    control: form.control,
    name: "variantId",
  });
  const currentVariant = useMemo(
    () => variantOptions.find((variant) => variant.id === Number(selectedVariantId)),
    [selectedVariantId, variantOptions],
  );
  const isCostRequired =
    adjustmentType === "OPENING_STOCK" ||
    adjustmentType === "ADJUSTMENT_IN";

  async function onSubmit(values: StockAdjustmentInput) {
    setIsSubmitting(true);

    try {
      await apiClient<{ movement: StockMovementView }>("/api/stock/adjustments", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          date: values.date instanceof Date ? values.date.toISOString() : values.date,
        }),
        showSuccessToast: true,
      });
      onSuccess();
    } catch {
      // Toast is handled by apiClient.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="variantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Variant</FormLabel>
              <FormControl>
                <ProductVariantCombobox
                  options={variantOptions}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              </FormControl>
              {currentVariant ? (
                <p className="text-xs text-slate-500">
                  Current stock: {currentVariant.currentStock.toLocaleString()}
                  {currentVariant.currentLandedCost
                    ? ` • Current cost: BDT ${Number(currentVariant.currentLandedCost).toLocaleString()}`
                    : ""}
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="adjustmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adjustment Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select adjustment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {manualStockAdjustmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "OPENING_STOCK" ? "Opening Stock" : formatEnum(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min="1" step="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitCostBdt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Unit Cost BDT{isCostRequired ? "" : " (Optional)"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={
                    field.value
                      ? new Date(field.value).toISOString().split("T")[0]
                      : getTodayDateInputValue()
                  }
                  onChange={(event) =>
                    field.onChange(new Date(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason / Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. Opening stock counted from old spreadsheet"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Stock Adjustment
          </Button>
        </div>
      </form>
    </Form>
  );
}
