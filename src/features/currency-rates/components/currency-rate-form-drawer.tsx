import { CrudDrawer } from "@/components/common/crud-drawer";
import { CurrencyRateForm } from "./currency-rate-form";
import { type DrawerState } from "../types/currency-rate";

export function CurrencyRateFormDrawer({
  drawer,
  onClose,
  onSuccess,
}: {
  drawer: DrawerState;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  return (
    <CrudDrawer
      description={
        drawer?.mode === "create"
          ? drawer.initialCurrencyRate
            ? "Create a new rate without overwriting older historical values."
            : "Add a reusable business rate."
          : "Edit an existing exchange rate."
      }
      onClose={onClose}
      open={drawer !== null}
      title={
        drawer?.mode === "create"
          ? drawer.initialCurrencyRate
            ? "Create New Rate"
            : "Add Rate"
          : "Edit Rate"
      }
    >
      {drawer?.mode === "create" ? (
        <CurrencyRateForm
          currencyRate={drawer.initialCurrencyRate}
          mode="create"
          onSuccess={onSuccess}
        />
      ) : null}
      {drawer?.mode === "edit" ? (
        <CurrencyRateForm
          currencyRate={drawer.currencyRate}
          mode="edit"
          onSuccess={onSuccess}
        />
      ) : null}
    </CrudDrawer>
  );
}
