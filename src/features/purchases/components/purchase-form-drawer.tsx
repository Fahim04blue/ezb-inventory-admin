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
          : "Update purchase details, items, and landed cost information."
      }
      className="w-full max-w-full rounded-none border-l border-stone-200 bg-[#faf7ef] shadow-2xl md:w-[min(880px,calc(100vw-40px))] xl:w-[min(920px,calc(100vw-300px))]"
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-0 pt-0 sm:px-5"
      headerClassName="sticky top-0 z-10 bg-[#faf7ef]/95 px-3 py-3 backdrop-blur sm:px-5 sm:py-4"
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
          onCancel={onClose}
          onSuccess={onSuccess}
        />
      ) : null}
    </CrudDrawer>
  );
}
