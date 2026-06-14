import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type SupplierView } from "../types/supplier";

export function SupplierMobileCardList({
  suppliers,
  onEdit,
  onToggleStatus,
}: {
  suppliers: SupplierView[];
  onEdit: (supplier: SupplierView) => void;
  onToggleStatus: (supplier: SupplierView) => void;
}) {
  return (
    <div className="grid gap-4 md:hidden">
      {suppliers.map((supplier) => (
        <Card key={supplier.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{supplier.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{supplier.country || "No country"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${supplier.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                {supplier.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{supplier.contactInfo || "No contact info"}</p>
            {supplier.notes ? <p className="mt-2 text-sm text-muted-foreground">{supplier.notes}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="w-auto px-4" onClick={() => onEdit(supplier)} variant="outline">
                Edit
              </Button>
              <Button className="w-auto px-4" onClick={() => onToggleStatus(supplier)} variant="outline">
                {supplier.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
