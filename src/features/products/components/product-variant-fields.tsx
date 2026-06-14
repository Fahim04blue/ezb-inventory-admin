import { type UseFieldArrayReturn, type UseFormRegister, type FieldValues } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function defaultVariant() {
  return {
    name: "",
    sku: "",
    defaultSellingPrice: "",
    productSizeValue: "",
    productSizeUnit: "" as const,
    shippingWeightKg: "",
    lowStockAlert: 0,
    isActive: true,
  };
}

export function ProductVariantFields({
  variants,
  register,
}: {
  variants: UseFieldArrayReturn<any, "variants">;
  register: UseFormRegister<any>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Variants</h3>
          <p className="text-sm text-muted-foreground">At least one variant is required.</p>
        </div>
        <Button
          className="w-auto px-4"
          onClick={() => variants.append(defaultVariant())}
          type="button"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </div>
      <div className="space-y-4">
        {variants.fields.map((field, index) => (
          <div className="rounded-2xl border border-border bg-background/70 p-4" key={field.id}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Variant Name</Label>
                <Input {...register(`variants.${index}.name`)} />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input {...register(`variants.${index}.sku`)} />
              </div>
              <div className="space-y-2">
                <Label>Default Selling Price</Label>
                <Input {...register(`variants.${index}.defaultSellingPrice`)} />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
                <Input
                  type="number"
                  {...register(`variants.${index}.lowStockAlert`, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Product Size</Label>
                <div className="flex gap-2">
                  <Input placeholder="e.g. 250" {...register(`variants.${index}.productSizeValue`)} />
                  <select
                    className="flex h-11 w-24 rounded-xl border border-border bg-white px-3 text-sm"
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
                <Label>Shipping Weight (kg)</Label>
                <Input placeholder="e.g. 0.35" {...register(`variants.${index}.shippingWeightKg`)} />
                <p className="text-[10px] text-muted-foreground">Cargo chargeable weight in kg</p>
              </div>
              <div className="flex items-end gap-2">
                <input
                  className="h-4 w-4"
                  type="checkbox"
                  {...register(`variants.${index}.isActive`)}
                />
                <Label>Active</Label>
              </div>
            </div>
            {variants.fields.length > 1 ? (
              <Button
                className="mt-4 w-auto px-4"
                onClick={() => variants.remove(index)}
                type="button"
                variant="outline"
              >
                Remove Variant
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
