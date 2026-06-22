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
    <div className="hidden w-full min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
      <div className="w-full min-w-0 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-4 border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
            <div>Supplier</div>
            <div>Country</div>
            <div>Contact Info</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-border">
            {suppliers.map((supplier) => (
              <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors" key={supplier.id}>
                <div>
                  <p className="font-semibold">{supplier.name}</p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${supplier.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                    {supplier.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{supplier.country || "Not set"}</div>
                <div className="text-sm text-muted-foreground">{supplier.contactInfo || "Not set"}</div>
                <div className="flex gap-2">
                  <Button className="h-8 px-3 text-xs" onClick={() => onEdit(supplier)} variant="outline">
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button className="h-8 px-3 text-xs" onClick={() => onToggleStatus(supplier)} variant="outline">
                    <Power className="mr-2 h-3 w-3" />
                    {supplier.isActive ? "Deact." : "Act."}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
