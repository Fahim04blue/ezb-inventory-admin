import { CrudDrawer } from "@/components/common/crud-drawer";
import { ExpenseForm } from "./expense-form";
import { type DrawerState } from "../types/expense.types";

export function ExpenseFormDrawer({
  drawer,
  onClose,
  onSuccess,
}: {
  drawer: DrawerState;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const isOpen = drawer !== null;
  const mode = drawer?.mode || "create";
  const expense = drawer?.expense;

  return (
    <CrudDrawer
      open={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Add Expense" : "Edit Expense"}
      description={
        mode === "create"
          ? "Add a new expense record."
          : "Update expense details."
      }
    >
      {isOpen && (
        <ExpenseForm
          mode={mode}
          expense={expense}
          onSuccess={onSuccess}
        />
      )}
    </CrudDrawer>
  );
}
