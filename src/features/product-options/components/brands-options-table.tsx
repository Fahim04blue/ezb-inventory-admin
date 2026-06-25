import { Edit, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductOptionsStatusBadge } from "./product-options-status-badge";
import type { ProductOptionItemView } from "../types/product-options";

export function BrandsOptionsTable({
  brands,
  onEdit,
  onToggleStatus,
}: {
  brands: ProductOptionItemView[];
  onEdit: (item: ProductOptionItemView) => void;
  onToggleStatus: (item: ProductOptionItemView) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] gap-4 border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
            <div>Name</div>
            <div>Description</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-border">
            {brands.map((brand) => (
              <div
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] items-center gap-4 px-4 py-3"
                key={brand.id}
              >
                <div className="font-semibold">{brand.name}</div>
                <div className="text-sm text-muted-foreground">
                  {brand.description || "No description"}
                </div>
                <div>
                  <ProductOptionsStatusBadge isActive={brand.isActive} />
                </div>
                <div className="flex gap-2">
                  <Button className="h-8 px-3 text-xs" onClick={() => onEdit(brand)} variant="outline">
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    className="h-8 px-3 text-xs"
                    onClick={() => onToggleStatus(brand)}
                    variant="outline"
                  >
                    <Power className="mr-2 h-3 w-3" />
                    {brand.isActive ? "Deact." : "Act."}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
