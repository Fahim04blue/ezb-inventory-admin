import { CrudDrawer } from "@/components/common/crud-drawer";
import { SalesSummaryForm } from "./sales-summary-form";
import { type DrawerState } from "../types/sales-summary.types";

export function SalesSummaryFormDrawer({
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
  const salesSummary = drawer?.salesSummary;

  return (
    <CrudDrawer
      open={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Add Sales Summary" : "Edit Sales Summary"}
      description={
        mode === "create"
          ? "Add a new sales income record."
          : "Update sales income details."
      }
    >
      {isOpen && (
        <SalesSummaryForm
          mode={mode}
          salesSummary={salesSummary}
          onSuccess={onSuccess}
        />
      )}
    </CrudDrawer>
  );
}
