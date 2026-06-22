import { Plus, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ExpenseEmptyState({
  onAdd,
  hasFilters = false,
}: {
  onAdd: () => void;
  hasFilters?: boolean;
}) {
  return (
    <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Receipt className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-950">
        {hasFilters ? "No expenses match these filters" : "No expenses found"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {hasFilters
          ? "Try adjusting the category, date, status, payment method, or search filters."
          : "Track product purchases, courier charges, ads, PR, packaging, and other outgoing costs here."}
      </p>
      <Button onClick={onAdd} className="mt-6 h-10 w-auto rounded-full px-5">
        <Plus className="mr-2 h-4 w-4" />
        Add Expense
      </Button>
    </div>
  );
}
