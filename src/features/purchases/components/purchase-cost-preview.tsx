import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/formatters";
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
  const getItemName = (id: number) => {
    const variant = variants.find((item) => item.id === id);
    if (!variant) return `Variant #${id}`;
    return `${variant.productName} - ${variant.name}`;
  };

  return (
    <div className="space-y-4">
      <Card className="border-dashed bg-muted/30">
        <CardHeader className="py-4">
          <CardTitle className="text-sm">Summary Cost Preview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items Subtotal ({purchaseCurrency !== "BDT" ? purchaseCurrency : "BDT"})</span>
            <span className="font-medium">{formatNumber(rawProductSubtotalForeign)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items Subtotal (BDT)</span>
            <span className="font-medium">{formatCurrency(rawProductSubtotalBdt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal Adjustment ({purchaseCurrency !== "BDT" ? purchaseCurrency : "BDT"})</span>
            <span className={productAdjustmentForeign < 0 ? "font-medium text-rose-700" : "font-medium text-amber-700"}>
              {formatNumber(productAdjustmentForeign)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal Adjustment (BDT)</span>
            <span className={productAdjustmentBdt < 0 ? "font-medium text-rose-700" : "font-medium text-amber-700"}>
              {formatCurrency(productAdjustmentBdt)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Adjusted Product Subtotal ({purchaseCurrency !== "BDT" ? purchaseCurrency : "BDT"})</span>
            <span className="font-medium">{formatNumber(productSubtotalForeign)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Adjusted Product Subtotal (BDT)</span>
            <span className="font-medium">{formatCurrency(productSubtotalBdt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cargo Charge (BDT)</span>
            <span className="font-medium">{formatCurrency(cargoChargeBdt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Other Import Cost (BDT)</span>
            <span className="font-medium">{formatCurrency(otherImportCostBdt)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
            <span>Total Landed Cost (BDT)</span>
            <span className="text-primary">{formatCurrency(totalLandedCostBdt)}</span>
          </div>
        </CardContent>
      </Card>

      {itemPreviews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Item-Level Landed Cost</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {itemPreviews.map((item, index) => (
              <Card key={index} className="text-xs">
                <CardHeader className="border-b px-4 py-3">
                  <CardTitle className="truncate text-xs">{getItemName(item.variantId)} (x{item.quantity})</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-1.5 p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Buying Cost:</span>
                    <span>{formatCurrency(item.baseUnitBuyingCostBdt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee/Discount per Unit:</span>
                    <span className={item.allocatedProductAdjustmentBdtPerUnit < 0 ? "text-rose-700" : "text-amber-700"}>
                      {formatCurrency(item.allocatedProductAdjustmentBdtPerUnit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Adjusted Product Cost:</span>
                    <span>{formatCurrency(item.unitBuyingCostBdt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allocated Cargo/Unit:</span>
                    <span>{formatCurrency(item.allocatedCargoCostBdtPerUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allocated Other/Unit:</span>
                    <span>{formatCurrency(item.allocatedOtherCostBdtPerUnit)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t pt-1 font-medium">
                    <span>Final Unit Landed:</span>
                    <span className="text-primary">{formatCurrency(item.finalUnitLandedCostBdt)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total Landed:</span>
                    <span>{formatCurrency(item.totalLandedCostBdt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
