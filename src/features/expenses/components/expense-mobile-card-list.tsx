import { Power, SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ExpenseCategoryBadge } from "./expense-category-badge";
import { ExpensePaymentMethodBadge } from "./expense-payment-method-badge";
import { type ExpenseView } from "../types/expense.types";

export function ExpenseMobileCardList({
  expenses,
  onEdit,
  onToggleStatus,
}: {
  expenses: ExpenseView[];
  onEdit: (expense: ExpenseView) => void;
  onToggleStatus: (expense: ExpenseView) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="rounded-[24px] border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">{expense.title}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDate(expense.date)}</p>
            </div>
            <p className="text-sm font-semibold text-slate-950">
              {formatCurrency(expense.amountBdt)}
            </p>
          </div>

          <p className="mt-3 text-sm text-slate-500">{expense.notes || "-"}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <ExpenseCategoryBadge category={expense.category} />
            <ExpensePaymentMethodBadge paymentMethod={expense.paymentMethod} />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium",
                  expense.isActive ? "text-emerald-700" : "text-slate-500",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    expense.isActive ? "bg-emerald-500" : "bg-slate-300",
                  )}
                />
                {expense.isActive ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={expense.isActive}
                onCheckedChange={() => onToggleStatus(expense)}
                aria-label="Toggle expense status"
                className="scale-90"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onEdit(expense)}
                className="h-9 w-9 rounded-xl border-slate-200 bg-white px-0 shadow-none"
              >
                <SquarePen className="h-4 w-4" />
                <span className="sr-only">Edit expense</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onToggleStatus(expense)}
                className="h-9 w-9 rounded-xl border-slate-200 bg-white px-0 shadow-none"
              >
                <Power className="h-4 w-4" />
                <span className="sr-only">Toggle expense status</span>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
