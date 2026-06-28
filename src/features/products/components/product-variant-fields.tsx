import { type UseFieldArrayReturn, type UseFormRegister } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ProductVariantImageField,
  type VariantImageState,
} from "./product-variant-image-field";

export function defaultVariant() {
  return {
    name: "Regular",
    sku: "",
    defaultSellingPrice: "",
    productSizeValue: "",
    productSizeUnit: "" as const,
    shippingWeightKg: "",
    lowStockAlert: 0,
    isActive: true,
    imagePath: null,
    imageUrl: null,
    imageAltText: null,
  };
}

export function ProductVariantFields({
  variants,
  register,
  imageStates,
  onImageSelect,
  onImageRemove,
  onVariantAppend,
  onVariantRemove,
}: {
  variants: UseFieldArrayReturn<any, "variants">;
  register: UseFormRegister<any>;
  imageStates: VariantImageState[];
  onImageSelect: (index: number, file: File) => void;
  onImageRemove: (index: number) => void;
  onVariantAppend: () => void;
  onVariantRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
              Variants
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              At least one variant is required.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Button
            className="h-9 w-full rounded-xl border-border bg-white px-3 text-sm shadow-none sm:w-auto sm:px-4"
            onClick={onVariantAppend}
            type="button"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {variants.fields.map((field, index) => (
          <div
            className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.045)]"
            key={field.id}
          >
            <div className="border-b border-border/60 bg-muted/15 px-3 py-2.5 sm:px-4">
              <p className="text-sm font-medium text-foreground">
                Variant {index + 1}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Variant Name</Label>
                <Input
                  className="h-11 rounded-xl border-border/80 shadow-none"
                  {...register(`variants.${index}.name`)}
                />
                {/* Note: In a nested array, errors prop needs to be passed down if we want to show exact validation messages here, 
                    but just having Zod focus the field with native behavior is often enough. 
                    Let's use standard HTML5 required to prevent empty sub-fields from silent blocking. */}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">SKU</Label>
                <Input
                  className="h-11 rounded-xl border-border/80 shadow-none"
                  {...register(`variants.${index}.sku`)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Default Selling Price</Label>
                <Input
                  className="h-11 rounded-xl border-border/80 shadow-none"
                  {...register(`variants.${index}.defaultSellingPrice`)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Low Stock Alert</Label>
                <Input
                  className="h-11 rounded-xl border-border/80 shadow-none"
                  type="number"
                  {...register(`variants.${index}.lowStockAlert`, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Product Size</Label>
                <div className="grid grid-cols-[minmax(0,1fr)_84px] gap-2">
                  <Input
                    className="h-11 rounded-xl border-border/80 shadow-none"
                    placeholder="e.g. 250"
                    {...register(`variants.${index}.productSizeValue`)}
                  />
                  <select
                    className="flex h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-none outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                    {...register(`variants.${index}.productSizeUnit`)}
                  >
                    <option value="">Unit</option>
                    <option value="ML">ML</option>
                    <option value="G">G</option>
                    <option value="KG">KG</option>
                    <option value="PCS">PCS</option>
                    <option value="SET">SET</option>
                  </select>
                </div>
                <p className="text-[10px] text-muted-foreground">Example: 250 ML or 50 G</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Shipping Weight (kg)</Label>
                <Input
                  className="h-11 rounded-xl border-border/80 shadow-none"
                  placeholder="e.g. 0.35"
                  {...register(`variants.${index}.shippingWeightKg`)}
                />
                <p className="text-[10px] text-muted-foreground">Cargo chargeable weight in kg</p>
              </div>
              <div className="col-span-2 rounded-xl border border-border/70 bg-muted/10 px-3 py-2.5">
                <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    className="h-4 w-4 rounded border-border"
                    type="checkbox"
                    {...register(`variants.${index}.isActive`)}
                  />
                  Active
                </Label>
              </div>
              <input type="hidden" {...register(`variants.${index}.imagePath`)} />
              <input type="hidden" {...register(`variants.${index}.imageUrl`)} />
              <input type="hidden" {...register(`variants.${index}.imageAltText`)} />
              <ProductVariantImageField
                id={`variant-image-${field.id}`}
                state={imageStates[index]}
                onSelect={(file) => onImageSelect(index, file)}
                onRemove={() => onImageRemove(index)}
              />
            </div>

            {variants.fields.length > 1 ? (
              <div className="border-t border-border/60 px-3 py-3 sm:px-4">
                <Button
                  className="h-9 w-full rounded-xl border-border bg-white px-4 text-sm shadow-none sm:w-auto"
                  onClick={() => onVariantRemove(index)}
                  type="button"
                  variant="outline"
                >
                  Remove Variant
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
