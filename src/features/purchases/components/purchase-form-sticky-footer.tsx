import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

type PurchaseFormStickyFooterProps = {
  isPending: boolean;
  isEditMode: boolean;
  onCancel: () => void;
  productSubtotalBdt: number;
  cargoChargeBdt: number;
  otherImportCostBdt: number;
  totalLandedCostBdt: number;
};

const footerItems = [
  { key: "productSubtotal", label: "Product Subtotal" },
  { key: "cargo", label: "Cargo" },
  { key: "otherCost", label: "Other Cost" },
  { key: "totalLanded", label: "Total Landed" },
] as const;

export function PurchaseFormStickyFooter({
  isPending,
  isEditMode,
  onCancel,
  productSubtotalBdt,
  cargoChargeBdt,
  otherImportCostBdt,
  totalLandedCostBdt,
}: PurchaseFormStickyFooterProps) {
  const values = {
    productSubtotal: productSubtotalBdt,
    cargo: cargoChargeBdt,
    otherCost: otherImportCostBdt,
    totalLanded: totalLandedCostBdt,
  } as const;

  return (
    <div className="sticky bottom-0 z-20 border-t border-stone-200 bg-[#faf7ef]/95 px-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur md:pb-1">
      <div className="grid grid-cols-4 gap-1.5">
        {footerItems.map((item) => (
          <div
            key={item.key}
            className={
              item.key === "totalLanded"
                ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5"
                : "rounded-md border border-stone-200 bg-white/90 px-2 py-1.5"
            }
          >
            <p className="truncate text-[8px] font-medium uppercase tracking-[0.04em] text-stone-500">{item.label}</p>
            <p className={item.key === "totalLanded" ? "mt-0.5 truncate text-[0.82rem] font-semibold text-emerald-700" : "mt-0.5 truncate text-[0.78rem] font-semibold text-stone-900"}>
              {formatCurrency(values[item.key])}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-[0.9fr_1.6fr] gap-2 border-t border-stone-200 pt-2">
        <Button disabled={isPending} type="button" variant="outline" className="h-9 w-full rounded-md border-stone-300 bg-white px-3 text-sm text-stone-800" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={isPending} type="submit" className="h-9 w-full rounded-md bg-emerald-700 px-3 text-sm text-white hover:bg-emerald-800">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isPending ? (isEditMode ? "Updating purchase…" : "Creating purchase…") : isEditMode ? "Update Purchase" : "Create Purchase"}
        </Button>
      </div>
    </div>
  );
}
