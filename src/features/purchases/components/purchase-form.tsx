"use client";

import React, { useTransition } from "react";
import { apiClient } from "@/lib/api-client";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Currency, PaymentStatus, PurchaseStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatEnum } from "@/lib/formatters";

import { createPurchaseSchema } from "../schemas/purchase.schema";
import { calculatePreviewCosts } from "../utils/purchase-calculations";
import { PurchaseCostPreview } from "./purchase-cost-preview";
import { PurchaseItemsFieldArray } from "./purchase-items-field-array";

export type SupplierOption = { id: number; name: string };
export type CurrencyRateOption = { id: number; currency: string; rateToBdt: string | number; rateType: string };
export type ProductVariantOption = {
  id: number;
  name: string;
  sku: string | null;
  productId: number;
  productName: string;
  brandName?: string | null;
  categoryName?: string | null;
  suggestedSellingPrice?: number | null;
  sizeValue?: number | null;
  sizeUnit?: string | null;
  shippingWeightKg?: number | null;
};

type PurchaseFormValues = z.input<typeof createPurchaseSchema>;

export function PurchaseForm({
  purchaseId,
  initialData,
  suppliers,
  currencyRates,
  variants,
  onSuccess,
}: {
  purchaseId?: number;
  initialData?: Partial<PurchaseFormValues>;
  suppliers: SupplierOption[];
  currencyRates: CurrencyRateOption[];
  variants: ProductVariantOption[];
  onSuccess: (message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [cargoInputMode, setCargoInputMode] = React.useState<"TOTAL" | "PER_KG">("TOTAL");
  const [cargoRatePerKg, setCargoRatePerKg] = React.useState("");

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(createPurchaseSchema),
    defaultValues: initialData || {
      status: PurchaseStatus.ORDERED,
      paymentStatus: PaymentStatus.UNPAID,
      purchaseDate: new Date(),
      purchaseCurrency: Currency.BDT,
      purchaseExchangeRateToBdt: "1",
      productAdjustmentForeign: "",
      items: [],
    },
  });

  const formValues = useWatch({ control: form.control }) as PurchaseFormValues;
  const previewCosts = calculatePreviewCosts(formValues);

  const totalShippingWeight = React.useMemo(() => {
    return formValues.items?.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const weight = Number(item.shippingWeightKg) || 0;
      return sum + qty * weight;
    }, 0) || 0;
  }, [formValues.items]);

  React.useEffect(() => {
    if (cargoInputMode === "PER_KG") {
      const rate = Number(cargoRatePerKg) || 0;
      if (rate >= 0) {
        const totalCharge = totalShippingWeight * rate;
        form.setValue("cargoChargeForeign", totalCharge > 0 ? totalCharge.toString() : "", { shouldValidate: true });
      }
    }
  }, [cargoInputMode, cargoRatePerKg, totalShippingWeight, form]);

  const handlePurchaseRateChange = (rateIdStr: string) => {
    form.setValue("purchaseRateId", rateIdStr === "none" ? null : parseInt(rateIdStr, 10));
    if (rateIdStr !== "none") {
      const rate = currencyRates.find((item) => item.id.toString() === rateIdStr);
      if (rate) {
        form.setValue("purchaseExchangeRateToBdt", rate.rateToBdt.toString());
      }
    }
  };

  const handleCargoRateChange = (rateIdStr: string) => {
    form.setValue("cargoRateId", rateIdStr === "none" ? null : parseInt(rateIdStr, 10));
    if (rateIdStr !== "none") {
      const rate = currencyRates.find((item) => item.id.toString() === rateIdStr);
      if (rate) {
        form.setValue("cargoExchangeRateToBdt", rate.rateToBdt.toString());
      }
    }
  };

  async function onSubmit(data: PurchaseFormValues) {
    startTransition(async () => {
      try {
        const url = purchaseId ? `/api/purchases/${purchaseId}` : "/api/purchases";
        const method = purchaseId ? "PUT" : "POST";

        const result = await apiClient(url, {
          method,
          body: JSON.stringify(data),
          showSuccessToast: true,
        });

        onSuccess(`Purchase ${purchaseId ? "updated" : "created"} successfully!`);
      } catch (error: any) {
        // error handled by toast
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value, 10))}
                  value={field.value ? field.value.toString() : "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
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
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Malaysia" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value
                        ? new Date(field.value as string | number | Date)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(event) => field.onChange(new Date(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier/Shop Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Currency).map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
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
            name="purchaseRateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card Purchase Rate Preset</FormLabel>
                <Select onValueChange={handlePurchaseRateChange} value={field.value ? field.value.toString() : "none"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preset or enter manually" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Manual Entry</SelectItem>
                    {currencyRates
                      .filter((rate) => rate.rateType === "CARD_PURCHASE")
                      .map((rate) => (
                        <SelectItem key={rate.id} value={rate.id.toString()}>
                          {rate.currency} @ {Number(rate.rateToBdt)}
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
            name="purchaseExchangeRateToBdt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exchange Rate (1 Foreign = X BDT)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.000001" min="0" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productAdjustmentForeign"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Subtotal Adjustment ({formValues.purchaseCurrency || "BDT"})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Use negative for discount, positive for extra fee"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Add supplier-side checkout fees as a positive amount. Enter discounts as a negative amount.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PurchaseStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatEnum(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-4 text-sm font-medium">Cargo & Other Costs</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="cargoCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo Charge Currency</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Object.values(Currency).map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
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
              name="cargoRateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo Rate Preset</FormLabel>
                  <Select onValueChange={handleCargoRateChange} value={field.value ? field.value.toString() : "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Manual / None</SelectItem>
                      {currencyRates
                        .filter((rate) => rate.rateType === "CARGO_PAYMENT")
                        .map((rate) => (
                          <SelectItem key={rate.id} value={rate.id.toString()}>
                            {rate.currency} @ {Number(rate.rateToBdt)}
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
              name="cargoExchangeRateToBdt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo Exchange Rate (1 {formValues.cargoCurrency || "Foreign"} = X BDT)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.000001" min="0" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="col-span-full space-y-2 md:col-span-1">
              <FormLabel className="text-sm font-medium">Cargo Calculation Method</FormLabel>
              <Select onValueChange={(value: "TOTAL" | "PER_KG") => setCargoInputMode(value)} value={cargoInputMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOTAL">Enter Total Cargo Amount Manually</SelectItem>
                  <SelectItem value="PER_KG">Auto-calculate from Rate per KG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cargoInputMode === "PER_KG" && (
              <FormItem>
                <FormLabel>Rate per KG ({formValues.cargoCurrency || "Foreign"})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cargoRatePerKg}
                    onChange={(event) => setCargoRatePerKg(event.target.value)}
                    placeholder="e.g. 1250"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="cargoChargeForeign"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Cargo Charge ({formValues.cargoCurrency || "Foreign"})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      value={field.value ?? ""}
                      readOnly={cargoInputMode === "PER_KG"}
                      className={cargoInputMode === "PER_KG" ? "bg-muted" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherImportCostBdt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Import Cost (BDT)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <PurchaseItemsFieldArray variants={variants} purchaseCurrency={formValues.purchaseCurrency || "BDT"} />
        </div>

        {formValues.items && formValues.items.length > 0 && (
          <div className="border-t pt-4">
            <PurchaseCostPreview
              rawProductSubtotalForeign={previewCosts.rawProductSubtotalForeign}
              rawProductSubtotalBdt={previewCosts.rawProductSubtotalBdt}
              productAdjustmentForeign={previewCosts.productAdjustmentForeign}
              productAdjustmentBdt={previewCosts.productAdjustmentBdt}
              productSubtotalForeign={previewCosts.productSubtotalForeign}
              productSubtotalBdt={previewCosts.productSubtotalBdt}
              cargoChargeBdt={previewCosts.cargoChargeBdt}
              otherImportCostBdt={previewCosts.otherImportCostBdt}
              totalLandedCostBdt={previewCosts.totalLandedCostBdt}
              purchaseCurrency={formValues.purchaseCurrency || "BDT"}
              itemPreviews={previewCosts.itemPreviews}
              variants={variants}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional notes..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button disabled={isPending} type="submit" className="w-full sm:w-auto">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {purchaseId ? "Update Purchase" : "Create Purchase"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
