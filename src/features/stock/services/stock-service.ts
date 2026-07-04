import {
  OrderStatus,
  Prisma,
  StockMovementDirection,
  StockMovementType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { StockAdjustmentInput } from "../schemas/stock-schemas";
import type {
  StockMovementView,
  StockOverviewItem,
  StockOverviewResponse,
  StockSalesTrend,
} from "../types/stock.types";

type ApiUser = {
  id: number;
};

export class StockServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "StockServiceError";
    this.status = status;
  }
}

function decimalToString(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : value.toFixed(4);
}

function movementToView(movement: {
  id: number;
  productVariantId: number;
  type: StockMovementType;
  direction: StockMovementDirection;
  quantity: number;
  unitCost: Prisma.Decimal | null;
  totalCost: Prisma.Decimal | null;
  note: string | null;
  createdAt: Date;
}): StockMovementView {
  return {
    id: movement.id,
    productVariantId: movement.productVariantId,
    type: movement.type,
    direction: movement.direction,
    quantity: movement.quantity,
    unitCost: decimalToString(movement.unitCost),
    totalCost: decimalToString(movement.totalCost),
    note: movement.note,
    createdAt: movement.createdAt.toISOString(),
  };
}

function getTrendScore(trend: StockSalesTrend) {
  const scores: Record<StockSalesTrend, number> = {
    MANUAL_PRIORITY: 0,
    RUNNING_OUT: 90,
    FAST_MOVING: 70,
    LOW_STOCK: 60,
    OUT_OF_STOCK: 50,
    NORMAL: 20,
    SLOW_MOVING: 10,
    NO_SALES: 0,
    OVERSTOCKED: -10,
  };

  return scores[trend];
}

function getSalesTrend({
  currentStock,
  lowStockAlert,
  soldQtyLast30Days,
  soldQtyLast90Days,
  daysOfStockLeft,
  isPriority,
}: {
  currentStock: number;
  lowStockAlert: number | null;
  soldQtyLast30Days: number;
  soldQtyLast90Days: number;
  daysOfStockLeft: number | null;
  isPriority: boolean;
}): StockSalesTrend {
  if (isPriority) {
    return "MANUAL_PRIORITY";
  }

  if (currentStock <= 0) {
    return "OUT_OF_STOCK";
  }

  if (
    soldQtyLast30Days > 0 &&
    daysOfStockLeft !== null &&
    daysOfStockLeft <= 7
  ) {
    return "RUNNING_OUT";
  }

  if (soldQtyLast30Days >= 10) {
    return "FAST_MOVING";
  }

  if (
    currentStock > 0 &&
    soldQtyLast90Days > 0 &&
    soldQtyLast30Days <= 1
  ) {
    return "SLOW_MOVING";
  }

  if (currentStock > 0 && soldQtyLast90Days === 0) {
    return "NO_SALES";
  }

  if (lowStockAlert != null && currentStock <= lowStockAlert) {
    return "LOW_STOCK";
  }

  return "NORMAL";
}

export async function getStockOverview(): Promise<StockOverviewResponse> {
  const now = new Date();
  const cutoff30Days = new Date(now);
  cutoff30Days.setDate(now.getDate() - 30);
  const cutoff60Days = new Date(now);
  cutoff60Days.setDate(now.getDate() - 60);
  const cutoff90Days = new Date(now);
  cutoff90Days.setDate(now.getDate() - 90);

  const variants = await prisma.productVariant.findMany({
    orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
    include: {
      product: {
        include: {
          brand: true,
          category: true,
        },
      },
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const deliveredOrderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        status: OrderStatus.DELIVERED,
      },
    },
    select: {
      productVariantId: true,
      quantity: true,
      createdAt: true,
      order: {
        select: {
          deliveredAt: true,
          orderedAt: true,
          createdAt: true,
        },
      },
    },
  });

  const salesByVariant = new Map<
    number,
    {
      soldQtyLast30Days: number;
      soldQtyLast60Days: number;
      soldQtyLast90Days: number;
      lastSoldAt: Date | null;
    }
  >();

  deliveredOrderItems.forEach((item) => {
    if (!item.productVariantId) {
      return;
    }

    const soldAt =
      item.order.deliveredAt ?? item.order.orderedAt ?? item.order.createdAt ?? item.createdAt;
    const current = salesByVariant.get(item.productVariantId) ?? {
      soldQtyLast30Days: 0,
      soldQtyLast60Days: 0,
      soldQtyLast90Days: 0,
      lastSoldAt: null,
    };

    if (soldAt >= cutoff30Days) {
      current.soldQtyLast30Days += item.quantity;
    }

    if (soldAt >= cutoff60Days) {
      current.soldQtyLast60Days += item.quantity;
    }

    if (soldAt >= cutoff90Days) {
      current.soldQtyLast90Days += item.quantity;
    }

    if (!current.lastSoldAt || soldAt > current.lastSoldAt) {
      current.lastSoldAt = soldAt;
    }

    salesByVariant.set(item.productVariantId, current);
  });

  const recentMovements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const items: StockOverviewItem[] = variants.map((variant) => {
    const unitCost = variant.currentLandedCost ?? new Prisma.Decimal(0);
    const stockValue = unitCost.mul(variant.currentStock);
    const sales = salesByVariant.get(variant.id) ?? {
      soldQtyLast30Days: 0,
      soldQtyLast60Days: 0,
      soldQtyLast90Days: 0,
      lastSoldAt: null,
    };
    const averageDailySales = sales.soldQtyLast30Days / 30;
    const daysOfStockLeft =
      averageDailySales > 0 ? variant.currentStock / averageDailySales : null;
    const salesTrend = getSalesTrend({
      currentStock: variant.currentStock,
      lowStockAlert: variant.lowStockAlert,
      soldQtyLast30Days: sales.soldQtyLast30Days,
      soldQtyLast90Days: sales.soldQtyLast90Days,
      daysOfStockLeft,
      isPriority: variant.isPriority,
    });
    const stockPriorityScore =
      getTrendScore(salesTrend) + (variant.isPriority ? 100 : 0);

    return {
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      productId: variant.productId,
      productName: variant.product.name,
      brandName: variant.product.brand?.name ?? null,
      categoryName: variant.product.category?.name ?? null,
      currentStock: variant.currentStock,
      currentLandedCost: decimalToString(variant.currentLandedCost),
      imageUrl: variant.imageUrl,
      isPriority: variant.isPriority,
      priorityNote: variant.priorityNote,
      priorityRank: variant.priorityRank,
      lowStockAlert: variant.lowStockAlert,
      stockValue: stockValue.toFixed(4),
      lastMovement: variant.stockMovements[0]
        ? movementToView(variant.stockMovements[0])
        : null,
      soldQtyLast30Days: sales.soldQtyLast30Days,
      soldQtyLast60Days: sales.soldQtyLast60Days,
      soldQtyLast90Days: sales.soldQtyLast90Days,
      lastSoldAt: sales.lastSoldAt?.toISOString() ?? null,
      averageDailySales,
      daysOfStockLeft,
      salesTrend,
      stockPriorityScore,
      updatedAt: variant.updatedAt.toISOString(),
    };
  });

  const totalUnits = items.reduce((sum, item) => sum + item.currentStock, 0);
  const stockValue = items
    .reduce(
      (sum, item) => sum.add(new Prisma.Decimal(item.stockValue)),
      new Prisma.Decimal(0),
    )
    .toFixed(4);
  const lowStockItems = items.filter(
    (item) =>
      item.lowStockAlert != null && item.currentStock <= item.lowStockAlert,
  ).length;
  const recentAdjustmentCutoff = new Date();
  recentAdjustmentCutoff.setDate(recentAdjustmentCutoff.getDate() - 7);
  const recentAdjustments = await prisma.stockMovement.count({
    where: {
      createdAt: { gte: recentAdjustmentCutoff },
      type: {
        in: [
          StockMovementType.ADJUSTMENT_IN,
          StockMovementType.ADJUSTMENT_OUT,
          StockMovementType.DAMAGE,
          StockMovementType.GIVEAWAY,
          StockMovementType.PR_SEND,
        ],
      },
    },
  });

  return {
    summary: {
      totalUnits,
      stockValue,
      lowStockItems,
      recentAdjustments,
    },
    items,
    variantOptions: items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      productId: item.productId,
      productName: item.productName,
      brandName: item.brandName,
      categoryName: item.categoryName,
      currentStock: item.currentStock,
      currentLandedCost: item.currentLandedCost,
      imageUrl: item.imageUrl,
      isPriority: item.isPriority,
      priorityNote: item.priorityNote,
      priorityRank: item.priorityRank,
    })),
    recentMovements: recentMovements.map(movementToView),
  };
}

export async function getStockMovementsForVariant(variantId: number) {
  const movements = await prisma.stockMovement.findMany({
    where: { productVariantId: variantId },
    orderBy: { createdAt: "desc" },
  });

  return movements.map(movementToView);
}

function getMovementDirection(type: StockAdjustmentInput["adjustmentType"]) {
  if (type === "OPENING_STOCK" || type === StockMovementType.ADJUSTMENT_IN) {
    return StockMovementDirection.IN;
  }

  return StockMovementDirection.OUT;
}

function getPersistedMovementType(type: StockAdjustmentInput["adjustmentType"]) {
  return type === "OPENING_STOCK" ? StockMovementType.ADJUSTMENT_IN : type;
}

export async function createStockAdjustment(
  input: StockAdjustmentInput,
  user: ApiUser,
) {
  const direction = getMovementDirection(input.adjustmentType);
  const movementType = getPersistedMovementType(input.adjustmentType);
  const unitCost =
    input.unitCostBdt != null
      ? new Prisma.Decimal(input.unitCostBdt)
      : undefined;
  const totalCost = unitCost ? unitCost.mul(input.quantity) : undefined;

  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: input.variantId },
      select: {
        id: true,
        currentStock: true,
        currentLandedCost: true,
      },
    });

    if (!variant) {
      throw new StockServiceError("Product variant not found.", 404);
    }

    if (direction === StockMovementDirection.OUT && variant.currentStock < input.quantity) {
      throw new StockServiceError("Stock cannot go negative.", 400);
    }

    const nextStock =
      direction === StockMovementDirection.IN
        ? variant.currentStock + input.quantity
        : variant.currentStock - input.quantity;

    const notePrefix =
      input.adjustmentType === "OPENING_STOCK" ? "Opening stock" : "Manual stock adjustment";
    const note = [notePrefix, input.reason?.trim()].filter(Boolean).join(": ");

    await tx.productVariant.update({
      where: { id: input.variantId },
      data: {
        currentStock: nextStock,
        ...(direction === StockMovementDirection.IN && unitCost
          ? { currentLandedCost: unitCost }
          : {}),
      },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productVariantId: input.variantId,
        type: movementType,
        direction,
        quantity: input.quantity,
        unitCost: unitCost ?? variant.currentLandedCost,
        totalCost:
          totalCost ??
          (variant.currentLandedCost
            ? variant.currentLandedCost.mul(input.quantity)
            : undefined),
        note,
        createdAt: input.date,
        createdById: user.id,
      },
    });

    return movementToView(movement);
  });
}
