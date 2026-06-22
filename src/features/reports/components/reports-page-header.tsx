import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReportsPageHeader({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track sales, expenses, profit, stock value, and business performance.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-9 w-fit rounded-lg border-slate-200 bg-white px-3 shadow-sm"
      >
        <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );
}
