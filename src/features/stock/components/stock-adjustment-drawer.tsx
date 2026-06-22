import { CrudDrawer } from "@/components/common/crud-drawer";
import { StockAdjustmentForm } from "./stock-adjustment-form";
import type {
  StockAdjustmentDrawerState,
  StockVariantOption,
} from "../types/stock.types";

export function StockAdjustmentDrawer({
  drawer,
  variantOptions,
  onClose,
  onSuccess,
}: {
  drawer: StockAdjustmentDrawerState;
  variantOptions: StockVariantOption[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isOpen = drawer !== null;

  return (
    <CrudDrawer
      open={isOpen}
      onClose={onClose}
      title="Add Stock Adjustment"
      description="Add opening stock or record a manual stock change."
    >
      {isOpen && (
        <StockAdjustmentForm
          drawer={drawer}
          variantOptions={variantOptions}
          onSuccess={onSuccess}
        />
      )}
    </CrudDrawer>
  );
}
