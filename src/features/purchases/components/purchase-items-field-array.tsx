import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Minus, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { ProductUnit } from "@/lib/domain-enums";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatEnum } from "@/lib/formatters";

import { createPurchaseSchema } from "../schemas/purchase.schema";
import { ProductVariantCombobox } from "./product-variant-combobox";
import { type ProductVariantOption } from "./purchase-form";

type PurchaseFormInput = z.input<typeof createPurchaseSchema>;

export function PurchaseItemsFieldArray({
  variants,
  purchaseCurrency,
  purchaseRateToBdt,
}: {
  variants: ProductVariantOption[];
  purchaseCurrency: string;
  purchaseRateToBdt: string | number | undefined;
}) {
  const { control, setValue } = useFormContext<PurchaseFormInput>();
  const items = useWatch({ control, name: "items" }) || [];
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const purchaseRate = Number(purchaseRateToBdt) || 0;
  const unitPriceLabel = `Unit Price (${purchaseCurrency || "BDT"})`;
  const subtotalLabel = "Subtotal (BDT)";

  return (
    <div className="space-y-3">
      <div className="hidden xl:grid xl:grid-cols-[minmax(0,1fr)_120px_150px_140px_40px] xl:items-center xl:gap-3 xl:rounded-xl xl:border xl:border-stone-200 xl:bg-stone-50/80 xl:px-3 xl:py-2 xl:text-[11px] xl:font-semibold xl:uppercase xl:tracking-[0.08em] xl:text-stone-500">
        <span className="min-w-0">Product Variant</span>
        <span>Qty</span>
        <span>{unitPriceLabel}</span>
        <span>{subtotalLabel}</span>
        <span />
      </div>

      <div className="overflow-visible rounded-2xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        <div className={fields.length > 5 ? "purchase-section-scroll custom-scrollbar max-h-[320px] overflow-y-auto overflow-x-hidden divide-y divide-stone-100 bg-[linear-gradient(180deg,rgba(250,247,239,0.55)_0%,rgba(255,255,255,0)_12%,rgba(255,255,255,0)_88%,rgba(250,247,239,0.4)_100%)]" : "divide-y divide-stone-100"}>
          {fields.length === 0 ? (
            <div className="px-4 py-5 text-sm text-stone-500">No items added yet. Add an item to continue.</div>
          ) : (
            fields.map((field, index) => {
              const currentItem = items[index];
              const selectedVariant = variants.find((variant) => variant.id === Number(currentItem?.variantId || 0));
              const quantity = Number(currentItem?.quantity) || 0;
              const unitPriceForeign = Number(currentItem?.unitPriceForeign) || 0;
              const lineSubtotalBdt = quantity * unitPriceForeign * purchaseRate;

              return (
                <div key={field.id} className="min-w-0 px-3 py-3">
                  <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_120px_150px_140px_40px] xl:items-start">
                    <div className="min-w-0">
                      <FormField
                        control={control}
                        name={`items.${index}.variantId`}
                        render={({ field: variantField }) => (
                          <FormItem className="min-w-0">
                            <FormLabel className="text-xs font-medium text-stone-600 xl:sr-only">Product Variant</FormLabel>
                            <ProductVariantCombobox
                              options={variants}
                              value={variantField.value as number | undefined}
                              className="h-10 min-w-0 border-stone-200 bg-white text-left text-sm"
                              onChange={(val) => {
                                variantField.onChange(val);
                                if (!val) {
                                  return;
                                }

                                const variant = variants.find((item) => item.id === val);
                                if (!variant) {
                                  return;
                                }

                                setValue(`items.${index}.productSizeValue`, variant.sizeValue ? String(variant.sizeValue) : undefined);
                                setValue(`items.${index}.productSizeUnit`, (variant.sizeUnit as ProductUnit | undefined) || undefined);
                                setValue(`items.${index}.shippingWeightKg`, variant.shippingWeightKg ? String(variant.shippingWeightKg) : undefined);
                              }}
                            />
                            {selectedVariant ? (
                              <div className="mt-2 min-w-0 space-y-1">
                                <p className="truncate text-sm font-medium text-stone-900">
                                  {selectedVariant.productName} - {selectedVariant.name}
                                </p>
                                <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
                                  <span className="truncate">{selectedVariant.sku || "No SKU"}</span>
                                  {currentItem?.shippingWeightKg ? <span>Wt {currentItem.shippingWeightKg} kg</span> : null}
                                  {currentItem?.productSizeValue ? (
                                    <span>
                                      {currentItem.productSizeValue} {formatEnum(currentItem.productSizeUnit)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2.5 xl:contents">
                      <FormField
                        control={control}
                        name={`items.${index}.quantity`}
                        render={({ field: qtyField }) => (
                          <FormItem className="min-w-0">
                            <FormLabel className="text-xs font-medium text-stone-600 xl:sr-only">Qty</FormLabel>
                            <div className="flex h-10 min-w-0 items-center overflow-hidden rounded-lg border border-stone-200 bg-white">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-full w-9 shrink-0 rounded-none border-0 border-r border-stone-200 bg-white px-0 text-stone-700 hover:bg-stone-50"
                                onClick={() => qtyField.onChange(Math.max(1, (Number(qtyField.value) || 1) - 1))}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...qtyField}
                                  value={qtyField.value as number}
                                  className="h-full min-w-0 rounded-none border-0 px-2 text-center shadow-none focus-visible:ring-0"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-full w-9 shrink-0 rounded-none border-0 border-l border-stone-200 bg-white px-0 text-stone-700 hover:bg-stone-50"
                                onClick={() => qtyField.onChange((Number(qtyField.value) || 0) + 1)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`items.${index}.unitPriceForeign`}
                        render={({ field: priceField }) => (
                          <FormItem className="min-w-0">
                            <FormLabel className="text-xs font-medium text-stone-600 xl:sr-only">{unitPriceLabel}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.0001"
                                min="0"
                                {...priceField}
                                value={priceField.value as string}
                                className="h-10 min-w-0 border-stone-200 bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-stone-600 xl:sr-only">{subtotalLabel}</p>
                        <div className="flex h-10 min-w-0 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-900">
                          <span className="truncate">{formatCurrency(lineSubtotalBdt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end xl:items-start">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-9 shrink-0 rounded-lg border-stone-200 bg-white px-0 text-stone-500 hover:bg-rose-50 hover:text-rose-600 xl:h-10 xl:w-10"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-auto border-emerald-200 bg-emerald-50 px-3 text-emerald-700 hover:bg-emerald-100"
        onClick={() =>
          append({
            variantId: 0 as never,
            quantity: 1,
            unitPriceForeign: "0",
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  );
}
