import { Power, SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ExpenseCategoryBadge } from "./expense-category-badge";
import { ExpensePaymentMethodBadge } from "./expense-payment-method-badge";
import { type ExpenseView } from "../types/expense.types";

function ExpenseStatusIndicator({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        isActive ? "text-emerald-700" : "text-slate-500",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isActive ? "bg-emerald-500" : "bg-slate-300",
        )}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function ExpensesTable({
  expenses,
  onEdit,
  onToggleStatus,
}: {
  expenses: ExpenseView[];
  onEdit: (expense: ExpenseView) => void;
  onToggleStatus: (expense: ExpenseView) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow className="border-slate-200 bg-white hover:bg-transparent">
            <TableHead className="w-[128px] px-5 py-3 text-xs font-semibold text-slate-900">Date</TableHead>
            <TableHead className="py-3 text-xs font-semibold text-slate-900">Title &amp; Notes</TableHead>
            <TableHead className="w-[170px] py-3 text-xs font-semibold text-slate-900">Category</TableHead>
            <TableHead className="w-[170px] py-3 text-xs font-semibold text-slate-900">Payment Method</TableHead>
            <TableHead className="w-[140px] py-3 text-right text-xs font-semibold text-slate-900">Amount</TableHead>
            <TableHead className="w-[150px] py-3 text-xs font-semibold text-slate-900">Status</TableHead>
            <TableHead className="w-[104px] px-5 py-3 text-right text-xs font-semibold text-slate-900">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="border-slate-200/90 hover:bg-slate-50/80">
              <TableCell className="px-5 py-2.5 align-middle text-xs font-medium text-slate-700">
                {formatDate(expense.date)}
              </TableCell>
              <TableCell className="py-2.5 align-middle">
                <div className="max-w-[360px] space-y-0.5">
                  <p className="text-sm font-medium text-slate-950">{expense.title}</p>
                  <p className="line-clamp-1 text-xs text-slate-500">
                    {expense.notes || "-"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="py-2.5 align-middle">
                <ExpenseCategoryBadge category={expense.category} className="py-0.5" />
              </TableCell>
              <TableCell className="py-2.5 align-middle">
                <ExpensePaymentMethodBadge
                  paymentMethod={expense.paymentMethod}
                  className="py-0.5"
                />
              </TableCell>
              <TableCell className="py-2.5 text-right align-middle text-sm font-semibold text-slate-950">
                {formatCurrency(expense.amountBdt)}
              </TableCell>
              <TableCell className="py-2.5 align-middle">
                <div className="flex items-center gap-2">
                  <ExpenseStatusIndicator isActive={expense.isActive} />
                  <Switch
                    checked={expense.isActive}
                    onCheckedChange={() => onToggleStatus(expense)}
                    aria-label="Toggle expense status"
                    className="scale-[0.85]"
                  />
                </div>
              </TableCell>
              <TableCell className="px-5 py-2.5 align-middle">
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="outline"
                    onClick={() => onEdit(expense)}
                    className="h-8 w-8 rounded-lg border-slate-200 bg-white px-0 shadow-none"
                    title="Edit expense"
                  >
                    <SquarePen className="h-4 w-4" />
                    <span className="sr-only">Edit expense</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onToggleStatus(expense)}
                    className="h-8 w-8 rounded-lg border-slate-200 bg-white px-0 shadow-none"
                    title={expense.isActive ? "Mark inactive" : "Mark active"}
                  >
                    <Power className="h-4 w-4" />
                    <span className="sr-only">
                      {expense.isActive ? "Mark inactive" : "Mark active"}
                    </span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
