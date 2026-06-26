"use client";

import React, { useTransition } from "react";
import { apiClient } from "@/lib/api-client";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Currency, PaymentStatus, PurchaseStatus } from "@/lib/domain-enums";
import { CalendarDays, ClipboardList, FileText, Info, Landmark, Package2, Truck, WalletCards } from "lucide-react";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { createPurchaseSchema } from "../schemas/purchase.schema";
import { calculatePreviewCosts } from "../utils/purchase-calculations";
import { PurchaseCostPreview } from "./purchase-cost-preview";
import { PurchaseItemsFieldArray } from "./purchase-items-field-array";
import { PurchaseFormSection } from "./purchase-form-section";
import { PurchaseFormStickyFooter } from "./purchase-form-sticky-footer";

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
  onCancel,
  onSuccess,
}: {
  purchaseId?: number;
  initialData?: Partial<PurchaseFormValues>;
  suppliers: SupplierOption[];
  currencyRates: CurrencyRateOption[];
  variants: ProductVariantOption[];
  onCancel: () => void;
  onSuccess: (message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [cargoInputMode, setCargoInputMode] = React.useState<"TOTAL" | "PER_KG">("TOTAL");
  const [cargoRatePerKg, setCargoRatePerKg] = React.useState("");
  const [isCostInsightsCollapsed, setIsCostInsightsCollapsed] = React.useState(true);

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

        await apiClient(url, {
          method,
          body: JSON.stringify(data),
          showSuccessToast: true,
        });

        onSuccess(`Purchase ${purchaseId ? "updated" : "created"} successfully!`);
      } catch (_error: any) {
        // error handled by toast
      }
    });
  }

  const fieldClassName = "h-10 min-w-0 border-stone-200 bg-white";
  const mobileTwoColGrid = "grid grid-cols-2 gap-2.5 md:gap-3";
  const compactLabelClassName = "text-[11px] font-medium leading-4 text-stone-600";
  const inlineHintClassName = "flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] leading-4 text-stone-600";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 pb-2 pt-3">
          <div className="space-y-4">
          <PurchaseFormSection title="Basic Info" icon={<ClipboardList className="h-3.5 w-3.5" />}>
            <div className={mobileTwoColGrid}>
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={compactLabelClassName}>Supplier</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value, 10))}
                      value={field.value ? field.value.toString() : "none"}
                    >
                      <FormControl>
                        <SelectTrigger className={fieldClassName}>
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
                    <FormLabel className={compactLabelClassName}>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Malaysia" {...field} value={field.value || ""} className={fieldClassName} />
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
                    <FormLabel className={compactLabelClassName}>Purchase Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="date"
                          className={cn(fieldClassName, "pr-10")}
                          value={
                            field.value
                              ? new Date(field.value as string | number | Date)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(event) => field.onChange(new Date(event.target.value))}
                        />
                        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={compactLabelClassName}>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={fieldClassName}>
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
          </PurchaseFormSection>

          <PurchaseFormSection title="Currency & Rates" icon={<WalletCards className="h-3.5 w-3.5" />}>
            <div className={mobileTwoColGrid}>
              <FormField
                control={form.control}
                name="purchaseCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={compactLabelClassName}>Supplier Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={fieldClassName}>
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
                    <FormLabel className={compactLabelClassName}>Card Purchase Rate Preset</FormLabel>
                    <Select onValueChange={handlePurchaseRateChange} value={field.value ? field.value.toString() : "none"}>
                      <FormControl>
                        <SelectTrigger className={fieldClassName}>
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
                  <FormItem className="col-span-2">
                    <FormLabel className={compactLabelClassName}>Exchange Rate (1 Foreign = X BDT)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.000001" min="0" {...field} value={field.value ?? ""} className={fieldClassName} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </PurchaseFormSection>

          <PurchaseFormSection title="Purchase Items" icon={<Package2 className="h-3.5 w-3.5" />}>
            <PurchaseItemsFieldArray
              variants={variants}
              purchaseCurrency={formValues.purchaseCurrency || "BDT"}
              purchaseRateToBdt={formValues.purchaseExchangeRateToBdt}
            />
          </PurchaseFormSection>

          <PurchaseFormSection title="Costs" icon={<Truck className="h-3.5 w-3.5" />}>
            <div className="space-y-3">
              <div className={mobileTwoColGrid}>
                <FormField
                  control={form.control}
                  name="productAdjustmentForeign"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className={compactLabelClassName}>
                        Product Subtotal Adjustment ({formValues.purchaseCurrency || "BDT"})
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Use negative for discount"
                          className={fieldClassName}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cargoCurrency"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className={compactLabelClassName}>Cargo Charge Currency</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} value={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger className={fieldClassName}>
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
                    <FormItem className="min-w-0">
                      <FormLabel className={compactLabelClassName}>Cargo Rate Preset</FormLabel>
                      <Select onValueChange={handleCargoRateChange} value={field.value ? field.value.toString() : "none"}>
                        <FormControl>
                          <SelectTrigger className={fieldClassName}>
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
                    <FormItem className="min-w-0">
                      <FormLabel className={compactLabelClassName}>
                        Cargo Exchange Rate (1 Foreign = X BDT)
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" min="0" {...field} value={field.value ?? ""} className={fieldClassName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className={inlineHintClassName}>
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-500" />
                <p>Use a negative adjustment for supplier discounts. Use a positive amount for checkout or supplier-side fees.</p>
              </div>

              <div className={mobileTwoColGrid}>
                <FormItem className="min-w-0">
                  <FormLabel className={compactLabelClassName}>Cargo Calculation Method</FormLabel>
                  <Select onValueChange={(value: "TOTAL" | "PER_KG") => setCargoInputMode(value)} value={cargoInputMode}>
                    <SelectTrigger className={fieldClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOTAL">Enter Total Cargo Amount Manually</SelectItem>
                      <SelectItem value="PER_KG">Auto-calculate from Rate per KG</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>

                <FormField
                  control={form.control}
                  name="cargoChargeForeign"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className={compactLabelClassName}>Total Cargo Charge ({formValues.cargoCurrency || "Foreign"})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value ?? ""}
                          readOnly={cargoInputMode === "PER_KG"}
                          className={cn(fieldClassName, cargoInputMode === "PER_KG" && "bg-stone-100")}
                          placeholder="e.g. 0.00"
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
                    <FormItem className="min-w-0 col-span-2">
                      <FormLabel className={compactLabelClassName}>Other Import Cost (BDT)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} value={field.value ?? ""} className={fieldClassName} placeholder="e.g. 0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className={inlineHintClassName}>
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-500" />
                <p>
                  {cargoInputMode === "PER_KG"
                    ? `Cargo total is auto-calculated from the combined shipping weight: ${totalShippingWeight.toFixed(3)} kg.`
                    : "Enter the final cargo amount in the selected cargo currency."}
                </p>
              </div>

              {cargoInputMode === "PER_KG" ? (
                <div className={mobileTwoColGrid}>
                  <FormItem className="min-w-0">
                    <FormLabel className={compactLabelClassName}>Rate per KG ({formValues.cargoCurrency || "Foreign"})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cargoRatePerKg}
                        onChange={(event) => setCargoRatePerKg(event.target.value)}
                        placeholder="e.g. 1250"
                        className={fieldClassName}
                      />
                    </FormControl>
                  </FormItem>
                </div>
              ) : null}
            </div>
          </PurchaseFormSection>

          <PurchaseFormSection
            title="Cost Insights"
            icon={<Landmark className="h-3.5 w-3.5" />}
            collapsible
            collapsed={isCostInsightsCollapsed}
            onToggle={() => setIsCostInsightsCollapsed((value) => !value)}
          >
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
          </PurchaseFormSection>

          <PurchaseFormSection title="Notes" icon={<FileText className="h-3.5 w-3.5" />}>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this purchase (optional)..."
                      {...field}
                      value={field.value || ""}
                      className="min-h-[64px] resize-none border-stone-200 bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </PurchaseFormSection>
          </div>
        </div>

        <PurchaseFormStickyFooter
          isPending={isPending}
          isEditMode={Boolean(purchaseId)}
          onCancel={onCancel}
          productSubtotalBdt={previewCosts.productSubtotalBdt}
          cargoChargeBdt={previewCosts.cargoChargeBdt}
          otherImportCostBdt={previewCosts.otherImportCostBdt}
          totalLandedCostBdt={previewCosts.totalLandedCostBdt}
        />
      </form>
    </Form>
  );
}
