import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExpenseCategory } from "@prisma/client";
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
import { expenseSchema, type ExpenseInput } from "../schemas/expense-schemas";
import { type ExpenseView } from "../types/expense.types";
import { apiClient } from "@/lib/api-client";
import { formatEnum } from "@/lib/formatters";

type ExpenseFormValues = z.input<typeof expenseSchema>;

export function ExpenseForm({
  mode,
  expense,
  onSuccess,
}: {
  mode: "create" | "edit";
  expense?: ExpenseView;
  onSuccess: (message: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExpenseFormValues, unknown, ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: expense?.date ? new Date(expense.date) : new Date(),
      category: expense?.category || ExpenseCategory.OTHER,
      title: expense?.title || "",
      amountBdt: expense?.amountBdt || "",
      paymentMethod: expense?.paymentMethod || "",
      notes: expense?.notes || "",
      isActive: expense?.isActive ?? true,
    },
  });

  async function onSubmit(values: ExpenseInput) {
    setIsSubmitting(true);
    try {
      await apiClient<{ expense: ExpenseView }>(
        mode === "create" ? "/api/expenses" : `/api/expenses/${expense?.id}`,
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
    } catch (error) {
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(ExpenseCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatEnum(category)}
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Meta Ads Boost, Courier Fee" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amountBdt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (BDT)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Cash, Card, Bkash" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  Should this expense be counted?
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
            {mode === "create" ? "Save Expense" : "Update Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
