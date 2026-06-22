import { LineChart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SalesSummaryEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
        <LineChart className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">No sales summaries found</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Add previous sales records or bulk income to track your cash flow without creating detailed orders.
      </p>
      <Button onClick={onAdd} className="mt-6 gap-2 rounded-full px-6">
        <Plus className="h-4 w-4" />
        Add First Summary
      </Button>
    </div>
  );
}
