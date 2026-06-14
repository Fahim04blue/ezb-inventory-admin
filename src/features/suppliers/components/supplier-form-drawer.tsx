import { CrudDrawer } from "@/components/common/crud-drawer";
import { SupplierForm } from "./supplier-form";
import { type DrawerState } from "../types/supplier";

export function SupplierFormDrawer({
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
      description={drawer?.mode === "create" ? "Add a supplier for future purchasing workflows." : "Update supplier details."}
      onClose={onClose}
      open={drawer !== null}
      title={drawer?.mode === "create" ? "Add Supplier" : "Edit Supplier"}
    >
      {drawer?.mode === "create" ? (
        <SupplierForm mode="create" onSuccess={onSuccess} />
      ) : null}
      {drawer?.mode === "edit" ? (
        <SupplierForm mode="edit" onSuccess={onSuccess} supplier={drawer.supplier} />
      ) : null}
    </CrudDrawer>
  );
}
