import { CrudDrawer } from "@/components/common/crud-drawer";
import { PurchaseForm, type CurrencyRateOption, type ProductVariantOption, type SupplierOption } from "./purchase-form";
import { type PurchaseDrawerState } from "../types/purchase.types";

export function PurchaseFormDrawer({
  drawer,
  suppliers,
  currencyRates,
  variants,
  onClose,
  onSuccess,
}: {
  drawer: PurchaseDrawerState;
  suppliers: SupplierOption[];
  currencyRates: CurrencyRateOption[];
  variants: ProductVariantOption[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  let initialData = undefined;
  let purchaseId = undefined;

  if (drawer?.mode === "edit" && drawer.purchase) {
    purchaseId = drawer.purchase.id;
    initialData = {
      supplierId: drawer.purchase.supplierId ?? null,
      country: drawer.purchase.country || "",
      purchaseDate: drawer.purchase.purchaseDate ? new Date(drawer.purchase.purchaseDate) : new Date(),
      purchaseCurrency: drawer.purchase.purchaseCurrency,
      purchaseExchangeRateToBdt: drawer.purchase.purchaseExchangeRateToBdt,
      purchaseRateId: drawer.purchase.purchaseRateId ?? null,
      productAdjustmentForeign: drawer.purchase.productAdjustmentForeign || "",
      cargoCurrency: drawer.purchase.cargoCurrency || undefined,
      cargoExchangeRateToBdt: drawer.purchase.cargoExchangeRateToBdt || "",
      cargoRateId: drawer.purchase.cargoRateId ?? null,
      cargoChargeForeign: drawer.purchase.cargoChargeForeign || "",
      otherImportCostBdt: drawer.purchase.otherImportCostBdt || "",
      status: drawer.purchase.status,
      paymentStatus: drawer.purchase.paymentStatus,
      notes: drawer.purchase.notes || "",
      items: drawer.purchase.items.map((item) => ({
        variantId: item.productVariantId,
        quantity: item.quantity,
        unitPriceForeign: item.unitPriceForeign,
        productSizeValue: item.productSizeValue || "",
        productSizeUnit: item.productSizeUnit || undefined,
        shippingWeightKg: item.shippingWeightKg || "",
        suggestedSellingPrice: item.suggestedSellingPrice || "",
        notes: item.notes || "",
      })),
    };
  }

  return (
    <CrudDrawer
      description={
        drawer?.mode === "create"
          ? "Create a new purchase order and calculate landed costs."
          : "Update purchase details."
      }
      onClose={onClose}
      open={drawer !== null}
      title={drawer?.mode === "create" ? "Add Purchase" : "Edit Purchase"}
    >
      {drawer !== null ? (
        <PurchaseForm
          purchaseId={purchaseId}
          initialData={initialData}
          suppliers={suppliers}
          currencyRates={currencyRates}
          variants={variants}
          onSuccess={onSuccess}
        />
      ) : null}
    </CrudDrawer>
  );
}
