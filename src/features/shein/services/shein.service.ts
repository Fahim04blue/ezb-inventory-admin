import {
  OrderItemFulfillmentStatus,
  OrderSource,
  OrderStatus,
  OrderType,
  Prisma,
  SheinBatchItemStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  CreateNormalOrderFromSheinInput,
  SheinBatchInput,
  SheinBatchItemInput,
  SheinBatchItemsBulkInput,
  UpdateSheinCustomerOrderCostingInput,
  UpdateSheinCustomerAdvanceInput,
} from "../schemas/shein.schema";
import type {
  SheinBatchItemView,
  SheinBatchView,
  SheinCustomerOrderGroup,
} from "../types/shein.types";
import { calculateSheinItem, toMoneyString } from "../utils/shein-calculations";

type Actor = { id: number };

export class SheinServiceError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "SheinServiceError";
  }
}

function optionalText(value?: string | null) {
  return value?.trim() ? value.trim() : null;
}

function decimalString(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : value.toFixed(4);
}

function parseSheinOrderWeightCharge(notes: string | null | undefined) {
  const match = notes?.match(/^Weight charge:\s*([0-9]+(?:\.[0-9]+)?)\s*BDT$/im);
  return match?.[1] ? new Prisma.Decimal(match[1]) : new Prisma.Decimal(0);
}

function decimalEquals(value: Prisma.Decimal, next: Prisma.Decimal.Value) {
  return value.equals(new Prisma.Decimal(next));
}

function nullableDecimalEquals(
  value: Prisma.Decimal | null,
  next: Prisma.Decimal.Value | null | undefined,
) {
  if (value == null || next == null) {
    return value == null && next == null;
  }

  return value.equals(new Prisma.Decimal(next));
}

function itemToView(item: {
  id: string;
  batchId: string;
  batch: {
    batchName: string;
    bankRate?: Prisma.Decimal | null;
    customerWeightRatePerGram?: Prisma.Decimal;
    actualCargoRatePerGram?: Prisma.Decimal;
    orderDate?: Date | null;
  };
  customerName: string;
  phone: string;
  customerSource: string | null;
  address: string | null;
  productName: string;
  sku: string | null;
  sheinLink: string | null;
  imageUrl: string | null;
  screenshotUrl: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  customerQuotedPriceBdt: Prisma.Decimal;
  advanceReceivedBdt: Prisma.Decimal;
  actualSheinPriceRm: Prisma.Decimal | null;
  bankRateSnapshot: Prisma.Decimal | null;
  actualItemCostBdt: Prisma.Decimal | null;
  actualWeightGram: number | null;
  customerWeightRateSnapshot: Prisma.Decimal;
  customerWeightChargeBdt: Prisma.Decimal | null;
  actualCargoRateSnapshot: Prisma.Decimal;
  actualCargoCostBdt: Prisma.Decimal | null;
  totalCustomerPayableBdt: Prisma.Decimal | null;
  totalActualCostBdt: Prisma.Decimal | null;
  profitBdt: Prisma.Decimal | null;
  remainingDueBdt: Prisma.Decimal | null;
  status: SheinBatchItemStatus;
  movedToOrderId: number | null;
  movedToOrderItemId: number | null;
  movedToOrder?: {
    netProfit: Prisma.Decimal | null;
    netOrderProfit: Prisma.Decimal;
    productCost: Prisma.Decimal;
    totalProductCost: Prisma.Decimal;
    deliveryCharge?: Prisma.Decimal;
    courierDeduction?: Prisma.Decimal | null;
    courierCost?: Prisma.Decimal | null;
    notes?: string | null;
  } | null;
  movedAt: Date | null;
}): SheinBatchItemView {
  const usesOpenBatchRates = item.status !== SheinBatchItemStatus.MOVED_TO_ORDER;
  const customerWeightRateSnapshot =
    usesOpenBatchRates
      ? item.batch.customerWeightRatePerGram ?? item.customerWeightRateSnapshot
      : item.customerWeightRateSnapshot;
  const actualCargoRateSnapshot =
    usesOpenBatchRates
      ? item.batch.actualCargoRatePerGram ?? item.actualCargoRateSnapshot
      : item.actualCargoRateSnapshot;
  const bankRateSnapshot =
    usesOpenBatchRates
      ? item.batch.bankRate ?? item.bankRateSnapshot
      : item.bankRateSnapshot;
  const calculations = usesOpenBatchRates
    ? calculateSheinItem({
        quantity: item.quantity,
        customerQuotedPriceBdt: item.customerQuotedPriceBdt,
        advanceReceivedBdt: item.advanceReceivedBdt,
        actualSheinPriceRm: item.actualSheinPriceRm,
        bankRateSnapshot,
        actualWeightGram: item.actualWeightGram,
        customerWeightRateSnapshot,
        actualCargoRateSnapshot,
      })
    : null;

  return {
    id: item.id,
    batchId: item.batchId,
    batchName: item.batch.batchName,
    batchOrderDate: item.batch.orderDate?.toISOString() ?? null,
    customerName: item.customerName,
    phone: item.phone,
    customerSource: item.customerSource,
    address: item.address,
    productName: item.productName,
    sku: item.sku,
    sheinLink: item.sheinLink,
    imageUrl: item.imageUrl,
    screenshotUrl: item.screenshotUrl,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    customerQuotedPriceBdt: item.customerQuotedPriceBdt.toFixed(4),
    advanceReceivedBdt: item.advanceReceivedBdt.toFixed(4),
    actualSheinPriceRm: decimalString(item.actualSheinPriceRm),
    bankRateSnapshot: decimalString(bankRateSnapshot),
    actualItemCostBdt: decimalString(item.actualItemCostBdt ?? calculations?.actualItemCostBdt),
    actualWeightGram: item.actualWeightGram,
    customerWeightRateSnapshot: customerWeightRateSnapshot.toFixed(4),
    customerWeightChargeBdt: decimalString(item.customerWeightChargeBdt ?? calculations?.customerWeightChargeBdt),
    actualCargoRateSnapshot: actualCargoRateSnapshot.toFixed(4),
    actualCargoCostBdt: decimalString(item.actualCargoCostBdt ?? calculations?.actualCargoCostBdt),
    totalCustomerPayableBdt: decimalString(item.totalCustomerPayableBdt ?? calculations?.totalCustomerPayableBdt),
    totalActualCostBdt: decimalString(item.totalActualCostBdt ?? calculations?.totalActualCostBdt),
    profitBdt: decimalString(item.profitBdt ?? calculations?.profitBdt),
    remainingDueBdt: decimalString(item.remainingDueBdt ?? calculations?.remainingDueBdt),
    status: item.status,
    movedToOrderId: item.movedToOrderId,
    movedToOrderItemId: item.movedToOrderItemId,
    movedToOrderNetProfit: decimalString(item.movedToOrder?.netProfit ?? item.movedToOrder?.netOrderProfit),
    movedToOrderProductCost: decimalString(item.movedToOrder?.productCost ?? item.movedToOrder?.totalProductCost),
    movedAt: item.movedAt?.toISOString() ?? null,
  };
}

function batchToView(batch: Prisma.SheinBatchGetPayload<{ include: { items: { include: { batch: true } } } }>): SheinBatchView {
  const totalRm = batch.items.reduce(
    (sum, item) => sum.add((item.actualSheinPriceRm ?? new Prisma.Decimal(0)).mul(item.quantity)),
    new Prisma.Decimal(0),
  );
  const estimatedCustomerValue = batch.items.reduce(
    (sum, item) => sum.add(item.totalCustomerPayableBdt ?? item.customerQuotedPriceBdt.mul(item.quantity)),
    new Prisma.Decimal(0),
  );

  return {
    id: batch.id,
    batchName: batch.batchName,
    sourceCountry: batch.sourceCountry,
    currency: batch.currency,
    customerRmRate: batch.customerRmRate.toFixed(4),
    bankRate: decimalString(batch.bankRate),
    customerWeightRatePerGram: batch.customerWeightRatePerGram.toFixed(4),
    actualCargoRatePerGram: batch.actualCargoRatePerGram.toFixed(4),
    orderDate: batch.orderDate?.toISOString() ?? null,
    sheinOrderNumbers: batch.sheinOrderNumbers,
    sheinTrackingNumber: batch.sheinTrackingNumber,
    status: batch.status,
    notes: batch.notes,
    itemCount: batch.items.length,
    totalRm: totalRm.toFixed(4),
    estimatedCustomerValue: estimatedCustomerValue.toFixed(4),
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    items: batch.items.map(itemToView),
  };
}

function itemData(input: SheinBatchItemInput, batch: {
  bankRate: Prisma.Decimal | null;
  customerWeightRatePerGram: Prisma.Decimal;
  actualCargoRatePerGram: Prisma.Decimal;
}) {
  const bankRateSnapshot =
    input.bankRateSnapshot ?? (batch.bankRate == null ? undefined : Number(batch.bankRate));
  const customerWeightRateSnapshot =
    input.customerWeightRateSnapshot ?? Number(batch.customerWeightRatePerGram);
  const actualCargoRateSnapshot =
    input.actualCargoRateSnapshot ?? Number(batch.actualCargoRatePerGram);
  const calculations = calculateSheinItem({
    ...input,
    bankRateSnapshot,
    customerWeightRateSnapshot,
    actualCargoRateSnapshot,
  });

  return {
    customerName: input.customerName,
    phone: input.phone,
    customerSource: optionalText(input.customerSource),
    address: optionalText(input.address),
    productName: input.productName,
    sku: optionalText(input.sku),
    sheinLink: optionalText(input.sheinLink),
    imageUrl: optionalText(input.imageUrl),
    screenshotUrl: optionalText(input.screenshotUrl),
    size: optionalText(input.size),
    color: optionalText(input.color),
    quantity: input.quantity,
    customerQuotedPriceBdt: input.customerQuotedPriceBdt,
    advanceReceivedBdt: input.advanceReceivedBdt,
    actualSheinPriceRm: input.actualSheinPriceRm,
    bankRateSnapshot,
    actualItemCostBdt: toMoneyString(calculations.actualItemCostBdt),
    actualWeightGram: input.actualWeightGram,
    customerWeightRateSnapshot,
    customerWeightChargeBdt: toMoneyString(calculations.customerWeightChargeBdt),
    actualCargoRateSnapshot,
    actualCargoCostBdt: toMoneyString(calculations.actualCargoCostBdt),
    totalCustomerPayableBdt: toMoneyString(calculations.totalCustomerPayableBdt),
    totalActualCostBdt: toMoneyString(calculations.totalActualCostBdt),
    profitBdt: toMoneyString(calculations.profitBdt),
    remainingDueBdt: calculations.remainingDueBdt.toFixed(4),
    status: input.status,
  };
}

function batchStatusToItemStatus(status: SheinBatchInput["status"]) {
  if (status === "IN_CARGO") return SheinBatchItemStatus.IN_CARGO;
  if (status === "RECEIVED") return SheinBatchItemStatus.RECEIVED;
  if (status === "CANCELLED") return SheinBatchItemStatus.CANCELLED;
  return SheinBatchItemStatus.CONFIRMED;
}

export async function listSheinBatches() {
  const batches = await prisma.sheinBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { batch: true }, orderBy: { createdAt: "desc" } } },
  });

  return batches.map(batchToView);
}

export async function getSheinBatch(id: string) {
  const batch = await prisma.sheinBatch.findUnique({
    where: { id },
    include: { items: { include: { batch: true }, orderBy: { createdAt: "desc" } } },
  });

  if (!batch) {
    throw new SheinServiceError("SHEIN batch not found.", 404);
  }

  return batchToView(batch);
}

export async function createSheinBatch(input: SheinBatchInput) {
  const batch = await prisma.sheinBatch.create({
    data: {
      batchName: input.batchName,
      sourceCountry: input.sourceCountry,
      currency: input.currency,
      customerRmRate: input.customerRmRate,
      bankRate: input.bankRate,
      customerWeightRatePerGram: input.customerWeightRatePerGram,
      actualCargoRatePerGram: input.actualCargoRatePerGram,
      orderDate: input.orderDate,
      sheinOrderNumbers: optionalText(input.sheinOrderNumbers),
      sheinTrackingNumber: optionalText(input.sheinTrackingNumber),
      status: input.status,
      notes: optionalText(input.notes),
    },
    include: { items: { include: { batch: true } } },
  });

  return batchToView(batch);
}

export async function updateSheinBatch(id: string, input: SheinBatchInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.sheinBatch.findUnique({
      where: { id },
      select: {
        status: true,
        bankRate: true,
        customerWeightRatePerGram: true,
        actualCargoRatePerGram: true,
      },
    });
    if (!existing) {
      throw new SheinServiceError("SHEIN batch not found.", 404);
    }

    const batch = await tx.sheinBatch.update({
      where: { id },
      data: {
        batchName: input.batchName,
        sourceCountry: input.sourceCountry,
        currency: input.currency,
        customerRmRate: input.customerRmRate,
        bankRate: input.bankRate,
        customerWeightRatePerGram: input.customerWeightRatePerGram,
        actualCargoRatePerGram: input.actualCargoRatePerGram,
        orderDate: input.orderDate,
        sheinOrderNumbers: optionalText(input.sheinOrderNumbers),
        sheinTrackingNumber: optionalText(input.sheinTrackingNumber),
        status: input.status,
        notes: optionalText(input.notes),
      },
      include: { items: { include: { batch: true }, orderBy: { createdAt: "desc" } } },
    });

    const shouldRefreshItemCosts =
      !nullableDecimalEquals(existing.bankRate, input.bankRate) ||
      !decimalEquals(existing.customerWeightRatePerGram, input.customerWeightRatePerGram) ||
      !decimalEquals(existing.actualCargoRatePerGram, input.actualCargoRatePerGram);

    if (shouldRefreshItemCosts) {
      const openItems = await tx.sheinBatchItem.findMany({
        where: {
          batchId: id,
          status: {
            notIn: [SheinBatchItemStatus.MOVED_TO_ORDER, SheinBatchItemStatus.CANCELLED],
          },
        },
      });

      for (const item of openItems) {
        const calculations = calculateSheinItem({
          quantity: item.quantity,
          customerQuotedPriceBdt: item.customerQuotedPriceBdt,
          advanceReceivedBdt: item.advanceReceivedBdt,
          actualSheinPriceRm: item.actualSheinPriceRm,
          bankRateSnapshot: input.bankRate,
          actualWeightGram: item.actualWeightGram,
          customerWeightRateSnapshot: input.customerWeightRatePerGram,
          actualCargoRateSnapshot: input.actualCargoRatePerGram,
        });

        await tx.sheinBatchItem.update({
          where: { id: item.id },
          data: {
            bankRateSnapshot: input.bankRate,
            customerWeightRateSnapshot: input.customerWeightRatePerGram,
            customerWeightChargeBdt: toMoneyString(calculations.customerWeightChargeBdt),
            actualCargoRateSnapshot: input.actualCargoRatePerGram,
            actualCargoCostBdt: toMoneyString(calculations.actualCargoCostBdt),
            actualItemCostBdt: toMoneyString(calculations.actualItemCostBdt),
            totalCustomerPayableBdt: toMoneyString(calculations.totalCustomerPayableBdt),
            totalActualCostBdt: toMoneyString(calculations.totalActualCostBdt),
            profitBdt: toMoneyString(calculations.profitBdt),
            remainingDueBdt: calculations.remainingDueBdt.toFixed(4),
          },
        });
      }
    }

    if (existing.status !== input.status) {
      await tx.sheinBatchItem.updateMany({
        where: {
          batchId: id,
          status: { not: SheinBatchItemStatus.MOVED_TO_ORDER },
        },
        data: { status: batchStatusToItemStatus(input.status) },
      });
    }

    if (shouldRefreshItemCosts || existing.status !== input.status) {
      const refreshed = await tx.sheinBatch.findUniqueOrThrow({
        where: { id },
        include: { items: { include: { batch: true }, orderBy: { createdAt: "desc" } } },
      });
      return batchToView(refreshed);
    }

    return batchToView(batch);
  });
}

export async function deleteSheinBatch(id: string) {
  await getSheinBatch(id);
  await prisma.sheinBatch.delete({ where: { id } });
}

export async function createSheinBatchItem(batchId: string, input: SheinBatchItemInput) {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.sheinBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new SheinServiceError("SHEIN batch not found.", 404);
    }

    const item = await tx.sheinBatchItem.create({
      data: { batchId, ...itemData(input, batch) },
      include: { batch: true },
    });

    return itemToView(item);
  });
}

export async function createSheinBatchItems(batchId: string, input: SheinBatchItemsBulkInput) {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.sheinBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new SheinServiceError("SHEIN batch not found.", 404);
    }

    const items = [];
    for (const itemInput of input.items) {
      const item = await tx.sheinBatchItem.create({
        data: { batchId, ...itemData(itemInput, batch) },
        include: { batch: true },
      });
      items.push(itemToView(item));
    }

    return items;
  });
}

export async function updateSheinBatchItem(itemId: string, input: SheinBatchItemInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.sheinBatchItem.findUnique({
      where: { id: itemId },
      include: { batch: true },
    });
    if (!existing) {
      throw new SheinServiceError("SHEIN item not found.", 404);
    }
    if (existing.status === SheinBatchItemStatus.MOVED_TO_ORDER) {
      throw new SheinServiceError("Moved SHEIN items cannot be edited.");
    }

    const nextCustomerSource = optionalText(input.customerSource);
    const item = await tx.sheinBatchItem.update({
      where: { id: itemId },
      data: itemData(input, existing.batch),
      include: { batch: true },
    });

    await tx.sheinBatchItem.updateMany({
      where: {
        id: { not: itemId },
        customerName: input.customerName,
        phone: input.phone,
      },
      data: {
        customerSource: nextCustomerSource,
      },
    });

    return itemToView(item);
  });
}

export async function deleteSheinBatchItem(itemId: string) {
  const item = await prisma.sheinBatchItem.findUnique({ where: { id: itemId } });
  if (!item) {
    throw new SheinServiceError("SHEIN item not found.", 404);
  }
  if (item.status === SheinBatchItemStatus.MOVED_TO_ORDER) {
    throw new SheinServiceError("Moved SHEIN items cannot be deleted.");
  }

  await prisma.sheinBatchItem.delete({ where: { id: itemId } });
}

export async function listSheinCustomerOrders(): Promise<SheinCustomerOrderGroup[]> {
  const items = await prisma.sheinBatchItem.findMany({
    orderBy: [{ customerName: "asc" }, { createdAt: "desc" }],
    include: {
      batch: true,
      movedToOrder: {
        select: {
          netProfit: true,
          netOrderProfit: true,
          productCost: true,
          totalProductCost: true,
          deliveryCharge: true,
          courierDeduction: true,
          courierCost: true,
          notes: true,
        },
      },
    },
  });
  const grouped = new Map<string, SheinBatchItemView[]>();

  for (const item of items.map(itemToView)) {
    const key = `${item.phone.trim().toLowerCase()}::${item.customerName.trim().toLowerCase()}`;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return Array.from(grouped.entries()).map(([key, groupItems]) => {
    const active = groupItems.filter((item) => item.status !== SheinBatchItemStatus.CANCELLED);
    const sum = (selector: (item: SheinBatchItemView) => string | null) =>
      active.reduce(
        (total, item) => total.add(selector(item) ?? 0),
        new Prisma.Decimal(0),
      );
    const notMoved = active.filter((item) => item.status !== SheinBatchItemStatus.MOVED_TO_ORDER);
    const movedOrderTotals = new Map<string, { profit: Prisma.Decimal; cost: Prisma.Decimal; weightCharge: Prisma.Decimal; deliveryCharge: Prisma.Decimal; codFee: Prisma.Decimal }>();
    active
      .filter((item) => item.movedToOrderId && item.movedToOrderNetProfit !== null)
      .forEach((item) => {
        if (!item.movedToOrderId || movedOrderTotals.has(String(item.movedToOrderId))) return;
        const sourceOrder = items.find((candidate) => candidate.id === item.id)?.movedToOrder;
        const weightCharge = parseSheinOrderWeightCharge(sourceOrder?.notes);
        const totalDeliveryCharge = sourceOrder?.deliveryCharge ?? new Prisma.Decimal(0);
        const deliveryCharge = totalDeliveryCharge.sub(weightCharge).isNegative()
          ? new Prisma.Decimal(0)
          : totalDeliveryCharge.sub(weightCharge);

        movedOrderTotals.set(String(item.movedToOrderId), {
          profit: new Prisma.Decimal(item.movedToOrderNetProfit ?? 0),
          cost: new Prisma.Decimal(item.movedToOrderProductCost ?? 0),
          weightCharge,
          deliveryCharge,
          codFee: sourceOrder?.courierDeduction ?? sourceOrder?.courierCost ?? new Prisma.Decimal(0),
        });
      });
    const finalProfit = Array.from(movedOrderTotals.values()).reduce(
      (total, order) => total.add(order.profit),
      new Prisma.Decimal(0),
    );
    const finalCost = Array.from(movedOrderTotals.values()).reduce(
      (total, order) => total.add(order.cost),
      new Prisma.Decimal(0),
    );
    const finalWeightCharge = Array.from(movedOrderTotals.values()).reduce(
      (total, order) => total.add(order.weightCharge),
      new Prisma.Decimal(0),
    );
    const finalDeliveryCharge = Array.from(movedOrderTotals.values()).reduce(
      (total, order) => total.add(order.deliveryCharge),
      new Prisma.Decimal(0),
    );
    const finalCodFee = Array.from(movedOrderTotals.values()).reduce(
      (total, order) => total.add(order.codFee),
      new Prisma.Decimal(0),
    );
    const estimatedProfit = sum((item) => item.profitBdt);
    const activeEstimatedProfit = notMoved.reduce(
      (total, item) => total.add(item.profitBdt ?? 0),
      new Prisma.Decimal(0),
    );
    const activeEstimatedCost = notMoved.reduce(
      (total, item) => total.add(item.totalActualCostBdt ?? 0),
      new Prisma.Decimal(0),
    );
    const activeEstimatedWeightCharge = notMoved.reduce(
      (total, item) => total.add(item.customerWeightChargeBdt ?? 0),
      new Prisma.Decimal(0),
    );
    const totalItems = active.reduce((sum, item) => sum + item.quantity, 0);
    const arrivedItems = active
      .filter((item) => item.status === SheinBatchItemStatus.RECEIVED)
      .reduce((sum, item) => sum + item.quantity, 0);
    const waitingStatuses: SheinBatchItemStatus[] = [
      SheinBatchItemStatus.CONFIRMED,
      SheinBatchItemStatus.IN_CARGO,
    ];
    const waitingItems = active
      .filter((item) => waitingStatuses.includes(item.status))
      .reduce((sum, item) => sum + item.quantity, 0);
    const movedItems = active
      .filter((item) => item.status === SheinBatchItemStatus.MOVED_TO_ORDER)
      .reduce((sum, item) => sum + item.quantity, 0);
    let status: SheinCustomerOrderGroup["status"] = "WAITING";
    if (!active.length) {
      status = "CANCELLED";
    } else if (movedItems === totalItems) {
      status = "COMPLETED";
    } else if (arrivedItems > 0 && waitingItems > 0) {
      status = "PARTIALLY_ARRIVED";
    } else if (arrivedItems > 0) {
      status = "READY_FOR_DELIVERY";
    }
    const profitKind = status === "COMPLETED" ? "FINAL" : "ESTIMATED";
    const profitAmount =
      profitKind === "FINAL" ? finalProfit : finalProfit.add(activeEstimatedProfit);
    const totalMoneySpent =
      profitKind === "FINAL" ? finalCost : finalCost.add(activeEstimatedCost);

    return {
      key,
      customerName: groupItems[0]?.customerName ?? "",
      phone: groupItems[0]?.phone ?? "",
      customerSource: groupItems.find((item) => item.customerSource)?.customerSource ?? null,
      address: groupItems[0]?.address ?? null,
      totalItems,
      arrivedItems,
      waitingItems,
      movedItems,
      totalAdvance: sum((item) => item.advanceReceivedBdt).toFixed(4),
      totalCustomerPayable: active
        .reduce(
          (total, item) =>
            total.add(item.totalCustomerPayableBdt ?? item.customerQuotedPriceBdt),
          new Prisma.Decimal(0),
        )
        .toFixed(4),
      totalCustomerWeightCharge: finalWeightCharge
        .add(activeEstimatedWeightCharge)
        .toFixed(4),
      totalDeliveryCharge: finalDeliveryCharge.toFixed(4),
      totalCodFee: finalCodFee.toFixed(4),
      totalDue: sum((item) => item.remainingDueBdt).toFixed(4),
      totalProfit: estimatedProfit.toFixed(4),
      totalMoneySpent: totalMoneySpent.toFixed(4),
      profitAmount: profitAmount.toFixed(4),
      profitKind,
      batches: Array.from(new Set(active.map((item) => item.batchName))),
      status,
      items: groupItems,
    };
  });
}

export async function updateSheinCustomerAdvance(input: UpdateSheinCustomerAdvanceInput) {
  await prisma.$transaction(async (tx) => {
    const items = await tx.sheinBatchItem.findMany({
      where: {
        customerName: input.customerName,
        phone: input.phone,
        status: {
          notIn: [SheinBatchItemStatus.CANCELLED, SheinBatchItemStatus.MOVED_TO_ORDER],
        },
      },
      include: { batch: true },
      orderBy: { createdAt: "asc" },
    });

    if (!items.length) {
      throw new SheinServiceError("No open SHEIN items found for this customer.", 404);
    }

    let remainingAdvance = new Prisma.Decimal(input.advanceReceivedBdt);

    for (const item of items) {
      const itemPayable = item.totalCustomerPayableBdt ?? item.customerQuotedPriceBdt.mul(item.quantity);
      const allocatedAdvance = remainingAdvance.lte(0)
        ? new Prisma.Decimal(0)
        : remainingAdvance.gt(itemPayable)
          ? itemPayable
          : remainingAdvance;
      const calculations = calculateSheinItem({
        quantity: item.quantity,
        customerQuotedPriceBdt: item.customerQuotedPriceBdt,
        advanceReceivedBdt: allocatedAdvance,
        actualSheinPriceRm: item.actualSheinPriceRm,
        bankRateSnapshot: item.bankRateSnapshot,
        actualWeightGram: item.actualWeightGram,
        customerWeightRateSnapshot: item.customerWeightRateSnapshot,
        actualCargoRateSnapshot: item.actualCargoRateSnapshot,
      });

      await tx.sheinBatchItem.update({
        where: { id: item.id },
        data: {
          advanceReceivedBdt: allocatedAdvance.toFixed(4),
          actualItemCostBdt: toMoneyString(calculations.actualItemCostBdt),
          customerWeightChargeBdt: toMoneyString(calculations.customerWeightChargeBdt),
          actualCargoCostBdt: toMoneyString(calculations.actualCargoCostBdt),
          totalCustomerPayableBdt: toMoneyString(calculations.totalCustomerPayableBdt),
          totalActualCostBdt: toMoneyString(calculations.totalActualCostBdt),
          profitBdt: toMoneyString(calculations.profitBdt),
          remainingDueBdt: calculations.remainingDueBdt.toFixed(4),
        },
      });

      remainingAdvance = remainingAdvance.sub(allocatedAdvance);
    }
  });

  return listSheinCustomerOrders();
}

async function generateOrderNumber(tx: Prisma.TransactionClient) {
  const today = new Date();
  const stamp = today.toISOString().slice(0, 10).replaceAll("-", "");
  const latest = await tx.order.findFirst({
    where: {
      orderNumber: { startsWith: `ORD-${stamp}-` },
    },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  const latestSequence = latest?.orderNumber.match(/-(\d+)$/)?.[1];
  const nextSequence = latestSequence ? Number(latestSequence) + 1 : 1;

  return `ORD-${stamp}-${String(nextSequence).padStart(4, "0")}`;
}

function allocateIntegerTotal(total: number, weights: number[]) {
  const baseTotal = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0 || baseTotal <= 0) {
    return weights.map(() => 0);
  }

  const raw = weights.map((weight) => total * weight / baseTotal);
  const allocations = raw.map(Math.floor);
  let remainder = total - allocations.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((first, second) => second.fraction - first.fraction);

  for (const { index } of order) {
    if (remainder <= 0) break;
    allocations[index] += 1;
    remainder -= 1;
  }

  return allocations;
}

function allocateDecimalTotal(total: Prisma.Decimal, weights: number[]) {
  const baseTotal = weights.reduce((sum, weight) => sum + weight, 0);
  if (total.lte(0) || baseTotal <= 0) {
    return weights.map(() => new Prisma.Decimal(0));
  }

  let remaining = total;
  return weights.map((weight, index) => {
    if (index === weights.length - 1) {
      return remaining;
    }

    const allocation = total.mul(weight).div(baseTotal);
    remaining = remaining.sub(allocation);
    return allocation;
  });
}

export async function updateSheinCustomerOrderCosting(input: UpdateSheinCustomerOrderCostingInput) {
  await prisma.$transaction(async (tx) => {
    const items = await tx.sheinBatchItem.findMany({
      where: { id: { in: input.itemIds } },
      include: { batch: true },
      orderBy: { createdAt: "asc" },
    });

    if (items.length !== input.itemIds.length) {
      throw new SheinServiceError("One or more selected SHEIN items were not found.");
    }
    if (items.some((item) => item.phone !== input.phone)) {
      throw new SheinServiceError("Selected SHEIN items must belong to the same phone number.");
    }
    if (items.some((item) => item.status !== SheinBatchItemStatus.RECEIVED)) {
      throw new SheinServiceError("Only received SHEIN items can have order costing updated.");
    }
    if (items.some((item) => item.movedToOrderId || item.movedToOrderItemId)) {
      throw new SheinServiceError("Moved SHEIN items cannot have order costing updated.");
    }

    const totalWeightGram = Math.max(0, Math.trunc(input.totalWeightGram));
    const totalCustomerWeightCharge = new Prisma.Decimal(input.weightCharge);
    const customerWeightRate =
      totalWeightGram > 0
        ? totalCustomerWeightCharge.div(totalWeightGram)
        : new Prisma.Decimal(0);
    const weights = allocateIntegerTotal(totalWeightGram, items.map((item) => item.quantity));
    const customerWeightChargeAllocations = allocateDecimalTotal(
      totalCustomerWeightCharge,
      totalWeightGram > 0 ? weights : items.map((item) => item.quantity),
    );

    for (const [index, item] of items.entries()) {
      const actualWeightGram = weights[index] ?? 0;
      const customerWeightChargeBdt =
        customerWeightChargeAllocations[index] ?? new Prisma.Decimal(0);
      const calculations = calculateSheinItem({
        quantity: item.quantity,
        customerQuotedPriceBdt: item.customerQuotedPriceBdt,
        advanceReceivedBdt: item.advanceReceivedBdt,
        actualSheinPriceRm: item.actualSheinPriceRm,
        bankRateSnapshot: item.batch.bankRate ?? item.bankRateSnapshot,
        actualWeightGram,
        customerWeightRateSnapshot: customerWeightRate,
        actualCargoRateSnapshot: item.batch.actualCargoRatePerGram,
      });
      const totalCustomerPayableBdt =
        item.customerQuotedPriceBdt.mul(item.quantity).add(customerWeightChargeBdt);
      const profitBdt = calculations.totalActualCostBdt
        ? totalCustomerPayableBdt.sub(calculations.totalActualCostBdt)
        : null;
      const remainingDueBdt = totalCustomerPayableBdt.sub(item.advanceReceivedBdt);

      await tx.sheinBatchItem.update({
        where: { id: item.id },
        data: {
          bankRateSnapshot: item.batch.bankRate ?? item.bankRateSnapshot,
          actualWeightGram: actualWeightGram > 0 ? actualWeightGram : null,
          customerWeightRateSnapshot: customerWeightRate,
          customerWeightChargeBdt: customerWeightChargeBdt.toFixed(4),
          actualCargoRateSnapshot: item.batch.actualCargoRatePerGram,
          actualCargoCostBdt: toMoneyString(calculations.actualCargoCostBdt),
          actualItemCostBdt: toMoneyString(calculations.actualItemCostBdt),
          totalCustomerPayableBdt: totalCustomerPayableBdt.toFixed(4),
          totalActualCostBdt: toMoneyString(calculations.totalActualCostBdt),
          profitBdt: toMoneyString(profitBdt),
          remainingDueBdt: remainingDueBdt.toFixed(4),
        },
      });
    }
  });

  return listSheinCustomerOrders();
}

export async function createNormalOrderFromShein(
  input: CreateNormalOrderFromSheinInput,
  user: Actor,
) {
  return prisma.$transaction(async (tx) => {
    const items = await tx.sheinBatchItem.findMany({
      where: { id: { in: input.itemIds } },
      include: { batch: true },
    });

    if (items.length !== input.itemIds.length) {
      throw new SheinServiceError("One or more selected SHEIN items were not found.");
    }
    if (items.some((item) => item.phone !== input.phone)) {
      throw new SheinServiceError("Selected SHEIN items must belong to the same phone number.");
    }
    if (items.some((item) => item.status !== SheinBatchItemStatus.RECEIVED)) {
      throw new SheinServiceError("Only received SHEIN items can be moved to an order.");
    }
    if (items.some((item) => item.movedToOrderId || item.movedToOrderItemId)) {
      throw new SheinServiceError("One or more SHEIN items already moved to an order.");
    }

    const subtotal = items.reduce(
      (total, item) => total.add(item.customerQuotedPriceBdt.mul(item.quantity)),
      new Prisma.Decimal(0),
    );
    const buyingCost = items.reduce(
      (total, item) => total.add(item.actualItemCostBdt ?? 0),
      new Prisma.Decimal(0),
    );
    const advance = items.reduce(
      (total, item) => total.add(item.advanceReceivedBdt),
      new Prisma.Decimal(0),
    );
    const discount = new Prisma.Decimal(input.discount);
    const delivery = new Prisma.Decimal(input.deliveryCharge);
    const weightCharge = new Prisma.Decimal(input.weightCharge);
    const actualWeightCost = new Prisma.Decimal(input.actualWeightCharge);
    const totalWeightGram = new Prisma.Decimal(input.totalWeightGram);
    const courier = new Prisma.Decimal(input.courierFee);
    const productCost = buyingCost.add(actualWeightCost);
    const amountToBeReceived = new Prisma.Decimal(input.amountReceived);
    const deliveryAndWeightCharge = delivery.add(weightCharge);
    const customerPayable = subtotal.sub(discount).add(deliveryAndWeightCharge);
    const cashReceived = advance.add(amountToBeReceived);
    const calculatedDue = customerPayable.sub(cashReceived).sub(courier);
    const dueAmount = calculatedDue.isNegative() ? new Prisma.Decimal(0) : calculatedDue;
    const netProfit = customerPayable.sub(productCost).sub(courier);

    if (customerPayable.isNegative()) {
      throw new SheinServiceError("Discount cannot be greater than SHEIN item total.");
    }

    const order = await tx.order.create({
      data: {
        orderNumber: await generateOrderNumber(tx),
        orderType: OrderType.NORMAL,
        status: OrderStatus.CONFIRMED,
        paymentStatus: input.paymentStatus,
        source: OrderSource.SHEIN,
        customerName: items[0]?.customerName,
        customerPhone: input.phone,
        customerAddress: items[0]?.address,
        orderDate: new Date(),
        orderedAt: new Date(),
        notes: [
          optionalText(input.notes) ?? "Created from SHEIN customer order",
          totalWeightGram.gt(0) ? `Total weight: ${totalWeightGram.toFixed(0)}g` : null,
          weightCharge.gt(0) ? `Weight charge: ${weightCharge.toFixed(2)} BDT` : null,
          actualWeightCost.gt(0) ? `Actual weight cost: ${actualWeightCost.toFixed(2)} BDT` : null,
          courier.gt(0) ? `COD fee: ${courier.toFixed(2)} BDT` : null,
          amountToBeReceived.gt(0) ? `Amount to be received: ${amountToBeReceived.toFixed(2)} BDT` : null,
        ].filter(Boolean).join("\n"),
        subtotal,
        discountAmount: discount,
        discount,
        deliveryCharge: deliveryAndWeightCharge,
        deliveryChargeCollected: deliveryAndWeightCharge,
        courierCost: courier,
        courierDeduction: courier,
        totalAmount: customerPayable,
        customerPayable,
        paidAmount: cashReceived,
        amountReceived: cashReceived,
        dueAmount,
        productCost,
        totalProductCost: productCost,
        grossProfit: subtotal.sub(productCost),
        netOrderProfit: netProfit,
        netProfit,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    for (const item of items) {
      const itemBuyingCost = item.actualItemCostBdt ?? new Prisma.Decimal(0);
      const itemQuoteTotal = item.customerQuotedPriceBdt.mul(item.quantity);
      const allocatedWeightCost = subtotal.gt(0)
        ? actualWeightCost.mul(itemQuoteTotal).div(subtotal)
        : new Prisma.Decimal(0);
      const unitCost = itemBuyingCost.add(allocatedWeightCost);
      const unitCostPerQuantity = item.quantity > 0 ? unitCost.div(item.quantity) : unitCost;
      const totalSellingPrice = item.customerQuotedPriceBdt.mul(item.quantity);
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          sheinBatchItemId: item.id,
          quantity: item.quantity,
          unitSellingPrice: item.customerQuotedPriceBdt,
          unitCost: unitCostPerQuantity,
          totalSellingPrice,
          totalCost: unitCost,
          profit: totalSellingPrice.sub(unitCost),
          fulfillmentStatus: OrderItemFulfillmentStatus.READY,
          deliveredQuantity: 0,
          deliveredAt: null,
          notes: `${item.productName}${item.sku ? ` / SKU ${item.sku}` : ""}${item.size ? ` / ${item.size}` : ""}${item.color ? ` / ${item.color}` : ""}`,
        },
      });

      await tx.sheinBatchItem.update({
        where: { id: item.id },
        data: {
          status: SheinBatchItemStatus.MOVED_TO_ORDER,
          movedToOrderId: order.id,
          movedToOrderItemId: orderItem.id,
          movedAt: new Date(),
        },
      });
    }

    return { id: order.id, orderNumber: order.orderNumber };
  });
}
