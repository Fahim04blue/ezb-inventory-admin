import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface StockPageHeaderProps {
  onAdd: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function StockPageHeader({
  onAdd,
}: StockPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Stock
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage physical stock, opening stock, adjustments, and movement history.
        </p>
      </div>

      <div className="flex flex-nowrap items-center gap-2 sm:justify-end">
        <Button
          onClick={onAdd}
          className="h-9 w-auto shrink-0 rounded-lg bg-primary px-3 text-sm shadow-sm hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Stock Adjustment
        </Button>
      </div>
    </div>
  );
}
