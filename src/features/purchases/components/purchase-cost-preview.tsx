import * as React from "react";

import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ItemCostPreview } from "../utils/purchase-calculations";

type PreviewVariant = {
  id: number;
  name: string;
  productName: string;
};

type PurchaseCostPreviewProps = {
  rawProductSubtotalForeign: number;
  rawProductSubtotalBdt: number;
  productAdjustmentForeign: number;
  productAdjustmentBdt: number;
  productSubtotalForeign: number;
  productSubtotalBdt: number;
  cargoChargeBdt: number;
  otherImportCostBdt: number;
  totalLandedCostBdt: number;
  purchaseCurrency: string;
  itemPreviews: ItemCostPreview[];
  variants: PreviewVariant[];
};

export function PurchaseCostPreview({
  rawProductSubtotalForeign,
  rawProductSubtotalBdt,
  productAdjustmentForeign,
  productAdjustmentBdt,
  productSubtotalForeign,
  productSubtotalBdt,
  cargoChargeBdt,
  otherImportCostBdt,
  totalLandedCostBdt,
  purchaseCurrency,
  itemPreviews,
  variants,
}: PurchaseCostPreviewProps) {
  const [selectedVariantId, setSelectedVariantId] = React.useState<number | null>(itemPreviews[0]?.variantId ?? null);

  const getItemName = (id: number) => {
    const variant = variants.find((item) => item.id === id);
    if (!variant) return `Variant #${id}`;
    return `${variant.productName} - ${variant.name}`;
  };

  const selectedItem = itemPreviews.find((item) => item.variantId === selectedVariantId) ?? itemPreviews[0];

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <div className="min-w-0 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
        <h4 className="text-sm font-semibold text-stone-900">Summary Cost Preview</h4>
        <div className="mt-4 grid gap-2 text-sm">
          <PreviewRow label="Items Subtotal (BDT)" value={formatCurrency(rawProductSubtotalBdt)} />
          <PreviewRow
            label="Subtotal Adjustment (BDT)"
            value={formatCurrency(productAdjustmentBdt)}
            valueClassName={productAdjustmentBdt < 0 ? "text-rose-700" : productAdjustmentBdt > 0 ? "text-amber-700" : undefined}
          />
          <PreviewRow label="Adjusted Product Subtotal (BDT)" value={formatCurrency(productSubtotalBdt)} />
          <PreviewRow label="Cargo Charge (BDT)" value={formatCurrency(cargoChargeBdt)} />
          <PreviewRow label="Other Import Cost (BDT)" value={formatCurrency(otherImportCostBdt)} />
          <div className="mt-2 flex items-center justify-between border-t border-stone-200 pt-3">
            <span className="text-sm font-semibold text-stone-900">Total Landed Cost (BDT)</span>
            <span className="text-lg font-semibold text-emerald-700">{formatCurrency(totalLandedCostBdt)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Raw items subtotal in {purchaseCurrency !== "BDT" ? purchaseCurrency : "BDT"}: {formatNumber(rawProductSubtotalForeign)}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Adjusted product subtotal in {purchaseCurrency !== "BDT" ? purchaseCurrency : "BDT"}: {formatNumber(productSubtotalForeign)}
        </p>
        {productAdjustmentForeign !== 0 ? (
          <p className="mt-1 text-xs text-stone-500">
            Subtotal adjustment in {purchaseCurrency !== "BDT" ? purchaseCurrency : "BDT"}: {formatNumber(productAdjustmentForeign)}
          </p>
        ) : null}
      </div>

      <div className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-stone-900">Item-Level Breakdown</h4>
        {selectedItem ? (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {itemPreviews.map((item) => (
                <button
                  key={`${item.variantId}-${item.quantity}`}
                  type="button"
                  className={cn(
                    "max-w-full rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    item.variantId === selectedItem.variantId
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100",
                  )}
                  onClick={() => setSelectedVariantId(item.variantId)}
                >
                  <span className="block truncate">{getItemName(item.variantId).split(" - ").slice(-1)[0]} x{item.quantity}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/60 p-4">
              <p className="mb-3 text-sm font-medium text-stone-900">{getItemName(selectedItem.variantId)}</p>
              <div className="grid gap-2 text-sm">
                <PreviewRow label="Base Buying Cost" value={formatCurrency(selectedItem.baseUnitBuyingCostBdt)} />
                <PreviewRow
                  label="Fee/Discount per Unit"
                  value={formatCurrency(selectedItem.allocatedProductAdjustmentBdtPerUnit)}
                  valueClassName={
                    selectedItem.allocatedProductAdjustmentBdtPerUnit < 0
                      ? "text-rose-700"
                      : selectedItem.allocatedProductAdjustmentBdtPerUnit > 0
                        ? "text-amber-700"
                        : undefined
                  }
                />
                <PreviewRow label="Adjusted Product Cost" value={formatCurrency(selectedItem.unitBuyingCostBdt)} />
                <PreviewRow label="Allocated Cargo/Unit" value={formatCurrency(selectedItem.allocatedCargoCostBdtPerUnit)} />
                <PreviewRow label="Allocated Other/Unit" value={formatCurrency(selectedItem.allocatedOtherCostBdtPerUnit)} />
                <PreviewRow label="Final Unit Landed" value={formatCurrency(selectedItem.finalUnitLandedCostBdt)} valueClassName="text-emerald-700" />
                <PreviewRow label={`Total Landed (x${selectedItem.quantity})`} value={formatCurrency(selectedItem.totalLandedCostBdt)} valueClassName="text-emerald-700" />
              </div>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-stone-500">Add items to see per-item landed cost details.</p>
        )}
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-stone-500">{label}</span>
      <span className={cn("font-medium text-stone-900", valueClassName)}>{value}</span>
    </div>
  );
}
