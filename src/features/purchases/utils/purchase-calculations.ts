import { z } from "zod";

import { createPurchaseSchema } from "../schemas/purchase.schema";

type PurchaseCalculationInput = z.input<typeof createPurchaseSchema>;

export type ItemCostPreview = {
  variantId: number;
  baseUnitBuyingCostBdt: number;
  allocatedProductAdjustmentBdtPerUnit: number;
  unitBuyingCostBdt: number;
  allocatedCargoCostBdtPerUnit: number;
  allocatedOtherCostBdtPerUnit: number;
  finalUnitLandedCostBdt: number;
  totalLandedCostBdt: number;
  quantity: number;
};

export function calculatePreviewCosts(input: Partial<PurchaseCalculationInput>) {
  const purchaseRate = Number(input.purchaseExchangeRateToBdt) || 0;
  const productAdjustmentForeign = input.productAdjustmentForeign
    ? Number(input.productAdjustmentForeign) || 0
    : 0;

  let cargoRate = 1;
  if (input.cargoCurrency === "BDT") {
    cargoRate = 1;
  } else if (input.cargoCurrency && input.cargoExchangeRateToBdt) {
    cargoRate = Number(input.cargoExchangeRateToBdt) || 1;
  }

  const cargoForeign = input.cargoChargeForeign ? Number(input.cargoChargeForeign) || 0 : 0;
  const cargoChargeBdt = input.cargoCurrency ? cargoForeign * cargoRate : 0;
  const otherImportCostBdt = input.otherImportCostBdt ? Number(input.otherImportCostBdt) || 0 : 0;

  const items = input.items || [];

  let rawProductSubtotalForeign = 0;
  let rawProductSubtotalBdt = 0;
  let totalShippingWeightKg = 0;
  let totalQuantity = 0;

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const unitForeign = Number(item.unitPriceForeign) || 0;
    const weight = Number(item.shippingWeightKg) || 0;

    rawProductSubtotalForeign += unitForeign * qty;
    rawProductSubtotalBdt += (unitForeign * purchaseRate) * qty;
    totalShippingWeightKg += weight * qty;
    totalQuantity += qty;
  }

  const productAdjustmentBdt = productAdjustmentForeign * purchaseRate;
  const productSubtotalForeign = rawProductSubtotalForeign + productAdjustmentForeign;
  const productSubtotalBdt = rawProductSubtotalBdt + productAdjustmentBdt;

  const itemPreviews: ItemCostPreview[] = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const unitForeign = Number(item.unitPriceForeign) || 0;
    const weight = Number(item.shippingWeightKg) || 0;
    const lineSubtotalForeign = unitForeign * qty;

    const baseUnitBuyingCostBdt = unitForeign * purchaseRate;

    let allocatedProductAdjustmentBdtPerUnit = 0;
    if (productAdjustmentBdt !== 0 && qty > 0) {
      if (rawProductSubtotalForeign > 0 && lineSubtotalForeign > 0) {
        const allocatedToLine = productAdjustmentBdt * (lineSubtotalForeign / rawProductSubtotalForeign);
        allocatedProductAdjustmentBdtPerUnit = allocatedToLine / qty;
      } else if (totalQuantity > 0) {
        const allocatedToLine = productAdjustmentBdt * (qty / totalQuantity);
        allocatedProductAdjustmentBdtPerUnit = allocatedToLine / qty;
      }
    }

    const unitBuyingCostBdt = baseUnitBuyingCostBdt + allocatedProductAdjustmentBdtPerUnit;

    let allocatedCargoCostBdtPerUnit = 0;
    if (cargoChargeBdt > 0 && qty > 0) {
      if (totalShippingWeightKg > 0) {
        const itemTotalWeight = weight * qty;
        const allocatedToLine = cargoChargeBdt * (itemTotalWeight / totalShippingWeightKg);
        allocatedCargoCostBdtPerUnit = allocatedToLine / qty;
      } else if (totalQuantity > 0) {
        const allocatedToLine = cargoChargeBdt * (qty / totalQuantity);
        allocatedCargoCostBdtPerUnit = allocatedToLine / qty;
      }
    }

    let allocatedOtherCostBdtPerUnit = 0;
    if (otherImportCostBdt > 0 && totalQuantity > 0 && qty > 0) {
      const allocatedToLine = otherImportCostBdt * (qty / totalQuantity);
      allocatedOtherCostBdtPerUnit = allocatedToLine / qty;
    }

    const finalUnitLandedCostBdt = unitBuyingCostBdt + allocatedCargoCostBdtPerUnit + allocatedOtherCostBdtPerUnit;
    const totalLandedCostBdt = finalUnitLandedCostBdt * qty;

    return {
      variantId: Number(item.variantId) || 0,
      quantity: qty,
      baseUnitBuyingCostBdt,
      allocatedProductAdjustmentBdtPerUnit,
      unitBuyingCostBdt,
      allocatedCargoCostBdtPerUnit,
      allocatedOtherCostBdtPerUnit,
      finalUnitLandedCostBdt,
      totalLandedCostBdt,
    };
  });

  const totalLandedCostBdt = productSubtotalBdt + cargoChargeBdt + otherImportCostBdt;

  return {
    rawProductSubtotalForeign,
    rawProductSubtotalBdt,
    productAdjustmentForeign,
    productAdjustmentBdt,
    productSubtotalForeign,
    productSubtotalBdt,
    cargoChargeBdt,
    otherImportCostBdt,
    totalLandedCostBdt,
    itemPreviews,
  };
}
