import { Edit, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type SupplierView } from "../types/supplier";

export function SuppliersTable({
  suppliers,
  onEdit,
  onToggleStatus,
}: {
  suppliers: SupplierView[];
  onEdit: (supplier: SupplierView) => void;
  onToggleStatus: (supplier: SupplierView) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
      <div className="grid grid-cols-[1.2fr_1fr_1.4fr_0.9fr] gap-4 border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground">
        <div>Supplier</div>
        <div>Country</div>
        <div>Contact Info</div>
        <div>Actions</div>
      </div>
      <div className="divide-y divide-border">
        {suppliers.map((supplier) => (
          <div className="grid grid-cols-[1.2fr_1fr_1.4fr_0.9fr] gap-4 px-6 py-5" key={supplier.id}>
            <div>
              <p className="font-semibold">{supplier.name}</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${supplier.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                {supplier.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">{supplier.country || "Not set"}</div>
            <div className="text-sm text-muted-foreground">{supplier.contactInfo || "Not set"}</div>
            <div className="space-y-2">
              <Button className="w-auto px-4" onClick={() => onEdit(supplier)} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button className="w-auto px-4" onClick={() => onToggleStatus(supplier)} variant="outline">
                <Power className="mr-2 h-4 w-4" />
                {supplier.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
