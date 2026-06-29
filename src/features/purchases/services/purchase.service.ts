import "server-only";

import {
  Prisma,
  PurchaseStatus,
  StockMovementDirection,
  StockMovementType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  syncActivePreOrderCostsForPurchaseItems,
  syncActivePreOrderCostsForVariants,
} from "@/features/orders/services/order.service";
import type {
  CreatePurchaseInput,
  ReceivePurchaseStockInput,
  UpdatePurchasePaymentInput,
  UpdatePurchaseInput,
  UpdatePurchaseStatusInput,
} from "../schemas/purchase.schema";

type Actor = { id: number };

export class PurchaseServiceError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

const purchaseSelect = {
  id: true,
  referenceNumber: true,
  title: true,
  supplierId: true,
  purchaseCurrency: true,
  purchaseExchangeRateToBdt: true,
  purchaseRateId: true,
  cargoCurrency: true,
  cargoExchangeRateToBdt: true,
  cargoRateId: true,
  orderedAt: true,
  purchaseDate: true,
  receivedAt: true,
  status: true,
  paymentStatus: true,
  country: true,
  notes: true,
  productSubtotalForeign: true,
  productSubtotalBdt: true,
  productAdjustmentForeign: true,
  productAdjustmentBdt: true,
  cargoChargeForeign: true,
  cargoChargeBdt: true,
  otherImportCostBdt: true,
  totalLandedCostBdt: true,
  createdAt: true,
  updatedAt: true,
  supplier: { select: { id: true, name: true } },
  items: {
    select: {
      id: true,
      purchaseId: true,
      productVariantId: true,
      quantity: true,
      receivedQuantity: true,
      unitPriceForeign: true,
      unitBuyingCostBdt: true,
      productSizeValue: true,
      productSizeUnit: true,
      shippingWeightKg: true,
      allocatedCargoCostBdt: true,
      allocatedOtherCostBdt: true,
      finalUnitLandedCostBdt: true,
      totalLandedCostBdt: true,
      suggestedSellingPrice: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      productVariant: {
        select: {
          id: true,
          name: true,
          sku: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const;

function generateReferenceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${timestamp}-${random}`;
}

function calculatePurchaseCosts(input: CreatePurchaseInput) {
  const purchaseRate = new Prisma.Decimal(input.purchaseExchangeRateToBdt);
  const productAdjustmentForeign = input.productAdjustmentForeign
    ? new Prisma.Decimal(input.productAdjustmentForeign)
    : new Prisma.Decimal(0);
  const productAdjustmentBdt = productAdjustmentForeign.mul(purchaseRate);

  let cargoRate = new Prisma.Decimal(1);
  if (input.cargoCurrency === "BDT") {
    cargoRate = new Prisma.Decimal(1);
  } else if (input.cargoCurrency && input.cargoExchangeRateToBdt) {
    cargoRate = new Prisma.Decimal(input.cargoExchangeRateToBdt);
  }

  const cargoForeign = input.cargoChargeForeign
    ? new Prisma.Decimal(input.cargoChargeForeign)
    : new Prisma.Decimal(0);

  const otherCost = input.otherImportCostBdt
    ? new Prisma.Decimal(input.otherImportCostBdt)
    : new Prisma.Decimal(0);

  const cargoBdt = input.cargoCurrency ? cargoForeign.mul(cargoRate) : new Prisma.Decimal(0);

  let totalShippingWeight = new Prisma.Decimal(0);
  let totalQuantity = 0;
  let rawProductSubtotalForeign = new Prisma.Decimal(0);
  let rawProductSubtotalBdt = new Prisma.Decimal(0);

  for (const item of input.items) {
    const qty = new Prisma.Decimal(item.quantity);
    const unitForeign = new Prisma.Decimal(item.unitPriceForeign);

    totalQuantity += item.quantity;
    rawProductSubtotalForeign = rawProductSubtotalForeign.add(unitForeign.mul(qty));
    rawProductSubtotalBdt = rawProductSubtotalBdt.add(unitForeign.mul(purchaseRate).mul(qty));

    if (item.shippingWeightKg) {
      totalShippingWeight = totalShippingWeight.add(
        new Prisma.Decimal(item.shippingWeightKg).mul(item.quantity)
      );
    }
  }

  const productSubtotalForeign = rawProductSubtotalForeign.add(productAdjustmentForeign);
  const productSubtotalBdt = rawProductSubtotalBdt.add(productAdjustmentBdt);

  if (productSubtotalForeign.lessThan(0) || productSubtotalBdt.lessThan(0)) {
    throw new PurchaseServiceError("Product subtotal adjustment cannot reduce the product subtotal below zero.", 400);
  }

  const processedItems = input.items.map((item) => {
    const qty = new Prisma.Decimal(item.quantity);
    const unitForeign = new Prisma.Decimal(item.unitPriceForeign);
    const lineSubtotalForeign = unitForeign.mul(qty);
    const baseUnitBuyingBdt = unitForeign.mul(purchaseRate);

    let allocatedProductAdjustment = new Prisma.Decimal(0);
    if (!productAdjustmentBdt.isZero() && qty.greaterThan(0)) {
      if (rawProductSubtotalForeign.greaterThan(0) && lineSubtotalForeign.greaterThan(0)) {
        const lineAdjustment = productAdjustmentBdt.mul(lineSubtotalForeign).div(rawProductSubtotalForeign);
        allocatedProductAdjustment = lineAdjustment.div(qty);
      } else if (totalQuantity > 0) {
        const lineAdjustment = productAdjustmentBdt.mul(qty).div(new Prisma.Decimal(totalQuantity));
        allocatedProductAdjustment = lineAdjustment.div(qty);
      }
    }

    const unitBuyingBdt = baseUnitBuyingBdt.add(allocatedProductAdjustment);

    let allocatedCargo = new Prisma.Decimal(0);
    if (cargoBdt.greaterThan(0) && qty.greaterThan(0)) {
      if (totalShippingWeight.greaterThan(0) && item.shippingWeightKg) {
        const itemWeight = new Prisma.Decimal(item.shippingWeightKg).mul(qty);
        allocatedCargo = cargoBdt.mul(itemWeight).div(totalShippingWeight).div(qty);
      } else if (totalQuantity > 0) {
        const lineAllocated = cargoBdt.mul(qty).div(new Prisma.Decimal(totalQuantity));
        allocatedCargo = lineAllocated.div(qty);
      }
    }

    let allocatedOther = new Prisma.Decimal(0);
    if (otherCost.greaterThan(0) && totalQuantity > 0 && qty.greaterThan(0)) {
      const lineAllocated = otherCost.mul(qty).div(new Prisma.Decimal(totalQuantity));
      allocatedOther = lineAllocated.div(qty);
    }

    const finalUnitLanded = unitBuyingBdt.add(allocatedCargo).add(allocatedOther);
    const totalLanded = finalUnitLanded.mul(qty);

    return {
      productVariantId: item.variantId,
      quantity: item.quantity,
      unitPriceForeign: unitForeign,
      productSizeValue: item.productSizeValue ? new Prisma.Decimal(item.productSizeValue) : null,
      productSizeUnit: item.productSizeUnit || null,
      shippingWeightKg: item.shippingWeightKg ? new Prisma.Decimal(item.shippingWeightKg) : null,
      suggestedSellingPrice: item.suggestedSellingPrice ? new Prisma.Decimal(item.suggestedSellingPrice) : null,
      notes: item.notes || null,
      unitBuyingCostBdt: unitBuyingBdt,
      allocatedCargoCostBdt: allocatedCargo,
      allocatedOtherCostBdt: allocatedOther,
      finalUnitLandedCostBdt: finalUnitLanded,
      totalLandedCostBdt: totalLanded,
    };
  });

  const totalLandedCostBdt = productSubtotalBdt.add(cargoBdt).add(otherCost);

  return {
    productSubtotalForeign,
    productSubtotalBdt,
    productAdjustmentForeign,
    productAdjustmentBdt,
    cargoChargeBdt: cargoBdt,
    otherImportCostBdt: otherCost,
    totalLandedCostBdt,
    processedItems,
  };
}

function buildOptionalConnectRelation(id: number | null | undefined) {
  if (id) {
    return { connect: { id } };
  }
  return { disconnect: true };
}

export async function syncPurchaseItemWeightForVariant(
  tx: Prisma.TransactionClient,
  productVariantId: number,
  shippingWeightKg: Prisma.Decimal | null,
  user: Actor,
) {
  const affectedItems = await tx.purchaseItem.findMany({
    where: {
      productVariantId,
      purchase: {
        status: { not: PurchaseStatus.CANCELLED },
      },
    },
    select: {
      purchaseId: true,
    },
  });

  const purchaseIds = [...new Set(affectedItems.map((item) => item.purchaseId))];

  if (purchaseIds.length === 0) {
    return;
  }

  await tx.purchaseItem.updateMany({
    where: {
      productVariantId,
      purchaseId: { in: purchaseIds },
    },
    data: {
      shippingWeightKg,
    },
  });

  const purchases = await tx.purchase.findMany({
    where: { id: { in: purchaseIds } },
    include: { items: true },
  });
  const receivedVariantIds = new Set<number>();

  for (const purchase of purchases) {
    const cargoBdt = purchase.cargoChargeBdt ?? new Prisma.Decimal(0);
    const totalQuantity = purchase.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalShippingWeight = purchase.items.reduce((sum, item) => {
      if (!item.shippingWeightKg) {
        return sum;
      }

      return sum.add(item.shippingWeightKg.mul(item.quantity));
    }, new Prisma.Decimal(0));

    for (const item of purchase.items) {
      const qty = new Prisma.Decimal(item.quantity);
      let allocatedCargo = new Prisma.Decimal(0);

      if (cargoBdt.greaterThan(0) && qty.greaterThan(0)) {
        if (totalShippingWeight.greaterThan(0) && item.shippingWeightKg) {
          const itemWeight = item.shippingWeightKg.mul(qty);
          allocatedCargo = cargoBdt.mul(itemWeight).div(totalShippingWeight).div(qty);
        } else if (totalQuantity > 0) {
          const lineAllocated = cargoBdt.mul(qty).div(new Prisma.Decimal(totalQuantity));
          allocatedCargo = lineAllocated.div(qty);
        }
      }

      const finalUnitLanded = item.unitBuyingCostBdt
        .add(allocatedCargo)
        .add(item.allocatedOtherCostBdt);

      await tx.purchaseItem.update({
        where: { id: item.id },
        data: {
          allocatedCargoCostBdt: allocatedCargo,
          finalUnitLandedCostBdt: finalUnitLanded,
          totalLandedCostBdt: finalUnitLanded.mul(qty),
        },
      });

      if (item.receivedQuantity > 0) {
        const receiveMovements = await tx.stockMovement.findMany({
          where: {
            purchaseItemId: item.id,
            type: StockMovementType.PURCHASE_RECEIVE,
          },
          select: {
            id: true,
            quantity: true,
          },
        });

        for (const movement of receiveMovements) {
          await tx.stockMovement.update({
            where: { id: movement.id },
            data: {
              unitCost: finalUnitLanded,
              totalCost: finalUnitLanded.mul(movement.quantity),
            },
          });
        }

        receivedVariantIds.add(item.productVariantId);
      }
    }

    await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        updatedById: user.id,
      },
    });

    await syncActivePreOrderCostsForPurchaseItems(
      tx,
      purchase.items.map((item) => item.id),
      user,
    );
  }

  for (const variantId of receivedVariantIds) {
    const latestReceiveMovement = await tx.stockMovement.findFirst({
      where: {
        productVariantId: variantId,
        type: StockMovementType.PURCHASE_RECEIVE,
        purchaseItemId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: {
        purchaseItem: {
          select: {
            finalUnitLandedCostBdt: true,
          },
        },
      },
    });

    if (latestReceiveMovement?.purchaseItem) {
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          currentLandedCost: latestReceiveMovement.purchaseItem.finalUnitLandedCostBdt,
          updatedById: user.id,
        },
      });
    }
  }
}

export async function listPurchases() {
  return prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    select: purchaseSelect,
  });
}

export async function getPurchaseById(id: number) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    select: purchaseSelect,
  });

  if (!purchase) {
    throw new PurchaseServiceError("Purchase not found.", 404);
  }

  return purchase;
}

export async function createPurchase(input: CreatePurchaseInput, user: Actor) {
  return prisma.$transaction(async (tx) => {
    if (input.supplierId) {
      const supplier = await tx.supplier.findUnique({
        where: { id: input.supplierId },
      });
      if (!supplier) throw new PurchaseServiceError("Supplier not found.", 404);
    }

    const costs = calculatePurchaseCosts(input);

    const purchase = await tx.purchase.create({
      data: {
        referenceNumber: generateReferenceNumber(),
        purchaseCurrency: input.purchaseCurrency,
        purchaseExchangeRateToBdt: new Prisma.Decimal(input.purchaseExchangeRateToBdt),
        cargoCurrency: input.cargoCurrency || null,
        cargoExchangeRateToBdt: input.cargoExchangeRateToBdt ? new Prisma.Decimal(input.cargoExchangeRateToBdt) : null,
        cargoChargeForeign: input.cargoChargeForeign ? new Prisma.Decimal(input.cargoChargeForeign) : null,
        country: input.country || null,
        purchaseDate: input.purchaseDate,
        status: input.status,
        paymentStatus: input.paymentStatus,
        notes: input.notes || null,
        productSubtotalForeign: costs.productSubtotalForeign,
        productSubtotalBdt: costs.productSubtotalBdt,
        productAdjustmentForeign: costs.productAdjustmentForeign.isZero() ? null : costs.productAdjustmentForeign,
        productAdjustmentBdt: costs.productAdjustmentBdt.isZero() ? null : costs.productAdjustmentBdt,
        cargoChargeBdt: costs.cargoChargeBdt,
        otherImportCostBdt: costs.otherImportCostBdt,
        totalLandedCostBdt: costs.totalLandedCostBdt,
        supplier: input.supplierId ? { connect: { id: input.supplierId } } : undefined,
        purchaseRate: input.purchaseRateId ? { connect: { id: input.purchaseRateId } } : undefined,
        cargoRate: input.cargoRateId ? { connect: { id: input.cargoRateId } } : undefined,
        createdBy: { connect: { id: user.id } },
        updatedBy: { connect: { id: user.id } },
        items: {
          create: costs.processedItems,
        },
      },
      select: purchaseSelect,
    });

    return purchase;
  });
}

export async function updatePurchase(id: number, input: UpdatePurchaseInput, user: Actor) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.purchase.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new PurchaseServiceError("Purchase not found.", 404);
    }

    if (existing.status === "RECEIVED") {
      throw new PurchaseServiceError("Cannot edit a fully received purchase.", 400);
    }

    if (input.supplierId) {
      const supplier = await tx.supplier.findUnique({
        where: { id: input.supplierId },
      });
      if (!supplier) throw new PurchaseServiceError("Supplier not found.", 404);
    }

    const costs = calculatePurchaseCosts(input);

    await tx.purchaseItem.deleteMany({
      where: { purchaseId: id },
    });

    const purchase = await tx.purchase.update({
      where: { id },
      data: {
        purchaseCurrency: input.purchaseCurrency,
        purchaseExchangeRateToBdt: new Prisma.Decimal(input.purchaseExchangeRateToBdt),
        cargoCurrency: input.cargoCurrency || null,
        cargoExchangeRateToBdt: input.cargoExchangeRateToBdt ? new Prisma.Decimal(input.cargoExchangeRateToBdt) : null,
        cargoChargeForeign: input.cargoChargeForeign ? new Prisma.Decimal(input.cargoChargeForeign) : null,
        country: input.country || null,
        purchaseDate: input.purchaseDate,
        status: input.status,
        paymentStatus: input.paymentStatus,
        notes: input.notes || null,
        productSubtotalForeign: costs.productSubtotalForeign,
        productSubtotalBdt: costs.productSubtotalBdt,
        productAdjustmentForeign: costs.productAdjustmentForeign.isZero() ? null : costs.productAdjustmentForeign,
        productAdjustmentBdt: costs.productAdjustmentBdt.isZero() ? null : costs.productAdjustmentBdt,
        cargoChargeBdt: costs.cargoChargeBdt,
        otherImportCostBdt: costs.otherImportCostBdt,
        totalLandedCostBdt: costs.totalLandedCostBdt,
        supplier: buildOptionalConnectRelation(input.supplierId),
        purchaseRate: buildOptionalConnectRelation(input.purchaseRateId),
        cargoRate: buildOptionalConnectRelation(input.cargoRateId),
        updatedBy: { connect: { id: user.id } },
        items: {
          create: costs.processedItems,
        },
      },
      select: purchaseSelect,
    });

    return purchase;
  });
}

export async function updatePurchaseStatus(id: number, input: UpdatePurchaseStatusInput, user: Actor) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!purchase) {
      throw new PurchaseServiceError("Purchase not found.", 404);
    }

    return tx.purchase.update({
      where: { id },
      data: {
        status: input.status,
        paymentStatus: input.paymentStatus !== undefined ? input.paymentStatus : undefined,
        updatedBy: { connect: { id: user.id } },
      },
      select: purchaseSelect,
    });
  });
}

export async function updatePurchasePayment(
  id: number,
  input: UpdatePurchasePaymentInput,
  user: Actor,
) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!purchase) {
      throw new PurchaseServiceError("Purchase not found.", 404);
    }

    return tx.purchase.update({
      where: { id },
      data: {
        paymentStatus: input.paymentStatus,
        updatedBy: { connect: { id: user.id } },
      },
      select: purchaseSelect,
    });
  });
}

function resolvePurchaseStatus(items: Array<{ quantity: number; receivedQuantity: number }>) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.receivedQuantity, 0);

  if (totalQuantity > 0 && totalReceived >= totalQuantity) {
    return PurchaseStatus.RECEIVED;
  }

  if (totalReceived > 0) {
    return PurchaseStatus.PARTIALLY_RECEIVED;
  }

  return null;
}

export async function receivePurchaseStock(
  id: number,
  input: ReceivePurchaseStockInput,
  user: Actor,
) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      throw new PurchaseServiceError("Purchase not found.", 404);
    }

    if (purchase.status === PurchaseStatus.CANCELLED) {
      throw new PurchaseServiceError("Cancelled purchases cannot receive stock.", 400);
    }

    const receiveByItemId = new Map(
      input.items.map((item) => [item.purchaseItemId, item.receiveQuantity]),
    );

    const changedItems = purchase.items.filter(
      (item) => (receiveByItemId.get(item.id) ?? 0) > 0,
    );

    if (changedItems.length === 0) {
      throw new PurchaseServiceError("Enter at least one quantity to receive.", 400);
    }

    for (const item of purchase.items) {
      const receiveQuantity = receiveByItemId.get(item.id) ?? 0;

      if (receiveQuantity < 0) {
        throw new PurchaseServiceError("Receive quantity cannot be negative.", 400);
      }

      const remainingQuantity = item.quantity - item.receivedQuantity;

      if (receiveQuantity > remainingQuantity) {
        throw new PurchaseServiceError(
          `Receive quantity for ${item.productVariant.product.name} - ${item.productVariant.name} exceeds remaining quantity.`,
          400,
        );
      }
    }

    for (const item of changedItems) {
      const receiveQuantity = receiveByItemId.get(item.id) ?? 0;
      const totalCost = item.finalUnitLandedCostBdt.mul(receiveQuantity);

      await tx.purchaseItem.update({
        where: { id: item.id },
        data: {
          receivedQuantity: { increment: receiveQuantity },
        },
      });

      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: {
          currentStock: { increment: receiveQuantity },
          currentLandedCost: item.finalUnitLandedCostBdt,
        },
      });

      await tx.stockMovement.create({
        data: {
          productVariantId: item.productVariantId,
          purchaseId: purchase.id,
          purchaseItemId: item.id,
          type: StockMovementType.PURCHASE_RECEIVE,
          direction: StockMovementDirection.IN,
          quantity: receiveQuantity,
          unitCost: item.finalUnitLandedCostBdt,
          totalCost,
          note: `Received stock for purchase ${purchase.referenceNumber}`,
          createdById: user.id,
        },
      });
    }

    await syncActivePreOrderCostsForVariants(
      tx,
      changedItems.map((item) => item.productVariantId),
      user,
    );

    const updatedItems = purchase.items.map((item) => ({
      quantity: item.quantity,
      receivedQuantity: item.receivedQuantity + (receiveByItemId.get(item.id) ?? 0),
    }));
    const nextStatus = resolvePurchaseStatus(updatedItems) ?? purchase.status;

    return tx.purchase.update({
      where: { id },
      data: {
        status: nextStatus,
        receivedAt: nextStatus === PurchaseStatus.RECEIVED ? new Date() : purchase.receivedAt,
        updatedBy: { connect: { id: user.id } },
      },
      select: purchaseSelect,
    });
  });
}
