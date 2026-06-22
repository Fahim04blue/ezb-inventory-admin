import { TableSkeleton } from "@/components/common/table-skeleton";

import { ExpenseEmptyState } from "./expense-empty-state";
import { ExpenseMobileCardList } from "./expense-mobile-card-list";
import { ExpensesTable } from "./expenses-table";
import { type ExpenseView } from "../types/expense.types";

export function ExpensesList({
  isLoading,
  expenses,
  onAdd,
  onEdit,
  onToggleStatus,
  hasFilters = false,
}: {
  isLoading: boolean;
  expenses: ExpenseView[];
  onAdd: () => void;
  onEdit: (expense: ExpenseView) => void;
  onToggleStatus: (expense: ExpenseView) => void;
  hasFilters?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-[30px] border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
        <TableSkeleton columns={7} rows={6} />
      </div>
    );
  }

  if (expenses.length === 0) {
    return <ExpenseEmptyState onAdd={onAdd} hasFilters={hasFilters} />;
  }

  return (
    <>
      <div className="hidden sm:block">
        <ExpensesTable
          expenses={expenses}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      </div>
      <div className="block sm:hidden">
        <ExpenseMobileCardList
          expenses={expenses}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      </div>
    </>
  );
}
