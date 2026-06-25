import { Edit, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RateTypeView } from "@/features/rate-types/types/rate-type";
import { ProductOptionsStatusBadge } from "./product-options-status-badge";

export function RateTypesOptionsTable({
  rateTypes,
  onEdit,
  onToggleStatus,
}: {
  rateTypes: RateTypeView[];
  onEdit: (item: RateTypeView) => void;
  onToggleStatus: (item: RateTypeView) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] gap-4 border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
            <div>Name</div>
            <div>Code</div>
            <div>Description</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-border">
            {rateTypes.map((rateType) => (
              <div
                className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] items-center gap-4 px-4 py-3"
                key={rateType.id}
              >
                <div className="font-semibold">{rateType.name}</div>
                <div className="text-sm font-medium text-slate-700">{rateType.code}</div>
                <div className="text-sm text-muted-foreground">
                  {rateType.description || "No description"}
                </div>
                <div>
                  <ProductOptionsStatusBadge isActive={rateType.isActive} />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="h-8 px-3 text-xs"
                    onClick={() => onEdit(rateType)}
                    variant="outline"
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    className="h-8 px-3 text-xs"
                    onClick={() => onToggleStatus(rateType)}
                    variant="outline"
                  >
                    <Power className="mr-2 h-3 w-3" />
                    {rateType.isActive ? "Deact." : "Act."}
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
