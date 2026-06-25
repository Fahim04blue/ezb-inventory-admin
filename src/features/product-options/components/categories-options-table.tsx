import { Edit, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductOptionsStatusBadge } from "./product-options-status-badge";
import type { ProductOptionItemView } from "../types/product-options";

export function CategoriesOptionsTable({
  categories,
  onEdit,
  onToggleStatus,
}: {
  categories: ProductOptionItemView[];
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
            {categories.map((category) => (
              <div
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] items-center gap-4 px-4 py-3"
                key={category.id}
              >
                <div className="font-semibold">{category.name}</div>
                <div className="text-sm text-muted-foreground">
                  {category.description || "No description"}
                </div>
                <div>
                  <ProductOptionsStatusBadge isActive={category.isActive} />
                </div>
                <div className="flex gap-2">
                  <Button className="h-8 px-3 text-xs" onClick={() => onEdit(category)} variant="outline">
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    className="h-8 px-3 text-xs"
                    onClick={() => onToggleStatus(category)}
                    variant="outline"
                  >
                    <Power className="mr-2 h-3 w-3" />
                    {category.isActive ? "Deact." : "Act."}
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
