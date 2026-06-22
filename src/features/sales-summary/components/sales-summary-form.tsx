import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderSource } from "@/lib/domain-enums";
import { Loader2 } from "lucide-react";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { salesSummarySchema, type SalesSummaryInput } from "../schemas/sales-summary-schemas";
import { type SalesSummaryView } from "../types/sales-summary.types";
import { apiClient } from "@/lib/api-client";
import { formatEnum } from "@/lib/formatters";

type SalesSummaryFormValues = z.input<typeof salesSummarySchema>;

export function SalesSummaryForm({
  mode,
  salesSummary,
  onSuccess,
}: {
  mode: "create" | "edit";
  salesSummary?: SalesSummaryView;
  onSuccess: (message: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SalesSummaryFormValues, unknown, SalesSummaryInput>({
    resolver: zodResolver(salesSummarySchema),
    defaultValues: {
      date: salesSummary?.date ? new Date(salesSummary.date) : new Date(),
      title: salesSummary?.title || "",
      source: salesSummary?.source || null,
      amountBdt: salesSummary?.amountBdt || "",
      estimatedProductCost: salesSummary?.estimatedProductCost || "",
      deliveryChargeCollectedBdt: salesSummary?.deliveryChargeCollectedBdt || "",
      notes: salesSummary?.notes || "",
      isActive: salesSummary?.isActive ?? true,
    },
  });

  const amountBdtValue = useWatch({ control: form.control, name: "amountBdt" });
  const estimatedProductCostValue = useWatch({
    control: form.control,
    name: "estimatedProductCost",
  });
  const amountReceived = Number(amountBdtValue || 0);
  const hasEstimatedCost = Boolean(estimatedProductCostValue?.trim());
  const estimatedProductCost = hasEstimatedCost
    ? Number(estimatedProductCostValue)
    : 0;
  const estimatedGrossProfit = amountReceived - estimatedProductCost;

  async function onSubmit(values: SalesSummaryInput) {
    setIsSubmitting(true);
    try {
      await apiClient<{ salesSummary: SalesSummaryView }>(
        mode === "create" ? "/api/sales-summaries" : `/api/sales-summaries/${salesSummary?.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: JSON.stringify({
            ...values,
            date: values.date instanceof Date ? values.date.toISOString() : values.date,
          }),
          showSuccessToast: true,
        }
      );
      onSuccess("");
    } catch {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                      : ""
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. October Sales, Bulk Orders" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source (Optional)</FormLabel>
              <Select onValueChange={(val) => field.onChange(val === "none" ? null : val)} value={field.value || "none"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {Object.values(OrderSource).map((source) => (
                    <SelectItem key={source} value={source}>
                      {formatEnum(source)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amountBdt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount / Product Income (BDT)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">Product sales revenue.</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimatedProductCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Product Cost</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Leave blank if unknown"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Optional. Use this for historical/bulk sales to estimate the cost of products sold. Leave blank if unknown.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
          {[
            ["Amount Received", amountReceived],
            ["Estimated Product Cost", hasEstimatedCost ? estimatedProductCost : null],
            ["Estimated Gross Profit", hasEstimatedCost ? estimatedGrossProfit : null],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {value === null
                  ? "Unknown"
                  : new Intl.NumberFormat("en-BD", {
                      style: "currency",
                      currency: "BDT",
                      minimumFractionDigits: 2,
                    }).format(Number(value))}
              </p>
            </div>
          ))}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any extra details..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Should this summary be counted?
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex w-full justify-end pt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Save Summary" : "Update Summary"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
