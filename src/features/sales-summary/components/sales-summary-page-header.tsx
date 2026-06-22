import { Plus, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SalesSummaryPageHeaderProps {
  onAdd: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function SalesSummaryPageHeader({
  onAdd,
  onRefresh,
  isRefreshing,
}: SalesSummaryPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Sales Summary
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Track summarized historical sales or bulk income.
        </p>
      </div>

      <div className="flex flex-nowrap items-center gap-2 sm:justify-end">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9 w-auto shrink-0 rounded-lg border-slate-200 bg-white px-3 text-sm shadow-sm"
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
        <Button
          onClick={onAdd}
          className="h-9 w-auto shrink-0 rounded-lg bg-primary px-3 text-sm shadow-sm hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Summary
        </Button>
      </div>
    </div>
  );
}
