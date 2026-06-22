import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductUnit } from "@/lib/domain-enums";
import { formatEnum } from "@/lib/formatters";
import { z } from "zod";
import { createPurchaseSchema } from "../schemas/purchase.schema";

import { ProductVariantCombobox } from "./product-variant-combobox";
import { type ProductVariantOption } from "./purchase-form";

export function PurchaseItemsFieldArray({ variants, purchaseCurrency }: { variants: ProductVariantOption[]; purchaseCurrency: string }) {
  const { control, setValue } = useFormContext<z.input<typeof createPurchaseSchema>>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Purchase Items</h3>
        <Button
          type="button"
          variant="outline"
          className="h-8 px-3 text-xs w-auto"
          onClick={() =>
            append({
              variantId: 0 as any,
              quantity: 1,
              unitPriceForeign: "0",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No items added yet. Add an item to continue.</p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="relative rounded-lg border p-4">
          <Button
            type="button"
            variant="outline"
            className="absolute right-2 top-2 h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pr-8">
            <FormField
              control={control}
              name={`items.${index}.variantId`}
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>Product Variant</FormLabel>
                  <ProductVariantCombobox
                    options={variants}
                    value={field.value as number | undefined}
                    onChange={(val) => {
                      field.onChange(val);
                      if (val) {
                        const variant = variants.find(v => v.id === val);
                        if (variant) {
                          if (variant.sizeValue) setValue(`items.${index}.productSizeValue`, String(variant.sizeValue));
                          else setValue(`items.${index}.productSizeValue`, undefined);

                          if (variant.sizeUnit) setValue(`items.${index}.productSizeUnit`, variant.sizeUnit as ProductUnit);
                          else setValue(`items.${index}.productSizeUnit`, undefined);

                          if (variant.shippingWeightKg) setValue(`items.${index}.shippingWeightKg`, String(variant.shippingWeightKg));
                          else setValue(`items.${index}.shippingWeightKg`, undefined);
                        }
                      }
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`items.${index}.quantity`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} value={field.value as any} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`items.${index}.unitPriceForeign`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Buying Price ({purchaseCurrency})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.0001" min="0" {...field} value={field.value as any} />
                  </FormControl>
                  <FormDescription className="text-[10px] leading-tight">supplier/shop price before conversion</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`items.${index}.shippingWeightKg`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Weight (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.001" min="0" {...field} value={(field.value as any) || ""} />
                  </FormControl>
                  <FormDescription className="text-[10px] leading-tight">cargo-chargeable weight in kg</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="col-span-full grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name={`items.${index}.productSizeValue`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Size</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" min="0" {...field} value={(field.value as any) || ""} />
                    </FormControl>
                    <FormDescription className="text-[10px] leading-tight">what is written on product, like 250 ML or 50 G</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`items.${index}.productSizeUnit`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={(field.value as string) || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {Object.values(ProductUnit).map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {formatEnum(unit)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
