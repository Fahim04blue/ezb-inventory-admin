import {
  OrderStatus,
  OrderType,
  PaymentStatus,
  Prisma,
  PurchaseStatus,
  StockMovementDirection,
  StockMovementType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  CreateOrderInput,
  FulfillPreOrderInput,
  UpdateOrderInput,
  UpdateOrderStatusInput,
} from "../schemas/order.schema";
import type {
  OrderView,
  OrdersPageData,
  PreOrderPurchaseItemOption,
} from "../types/order.types";
import {
  calculateOrderTotals,
  calculatePreOrderTotals,
} from "../utils/order-calculations";

type Actor = {
  id: number;
};

export class OrderServiceError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

function decimalToString(value: Prisma.Decimal | null | undefined) {
  return value == null ? "0.0000" : value.toFixed(4);
}

function decimalWithLegacyFallback(
  value: Prisma.Decimal | null | undefined,
  legacyValue: Prisma.Decimal | null | undefined,
) {
  if (value == null) {
    return legacyValue;
  }

  if (value.isZero() && legacyValue && !legacyValue.isZero()) {
    return legacyValue;
  }

  return value;
}

function optionalText(value?: string | null) {
  return value?.trim() ? value.trim() : null;
}

function orderToView(order: {
  id: number;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  source: string;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  orderDate: Date;
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  deliveryCharge: Prisma.Decimal;
  customerPayable?: Prisma.Decimal | null;
  courierDeduction?: Prisma.Decimal | null;
  amountReceived?: Prisma.Decimal | null;
  courierCost?: Prisma.Decimal | null;
  totalAmount: Prisma.Decimal;
  paidAmount: Prisma.Decimal;
  dueAmount: Prisma.Decimal;
  productCost: Prisma.Decimal;
  grossProfit: Prisma.Decimal;
  netProfit?: Prisma.Decimal | null;
  netOrderProfit?: Prisma.Decimal | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  items: Array<{
    id: number;
    productVariantId: number;
    purchaseItemId: number | null;
    quantity: number;
    unitSellingPrice: Prisma.Decimal;
    unitCost: Prisma.Decimal;
    totalSellingPrice: Prisma.Decimal;
    totalCost: Prisma.Decimal;
    profit: Prisma.Decimal;
    productVariant: {
      name: string;
      sku: string | null;
      currentStock: number;
      product: { name: string };
    };
    purchaseItem: {
      receivedQuantity: number;
      reservedPreOrderQuantity: number;
      purchase: {
        referenceNumber: string;
        country: string | null;
        supplier: { name: string } | null;
      };
    } | null;
  }>;
}): OrderView {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    status: order.status,
    paymentStatus: order.paymentStatus,
    source: order.source as OrderView["source"],
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    orderDate: order.orderDate.toISOString(),
    subtotal: decimalToString(order.subtotal),
    discountAmount: decimalToString(order.discountAmount),
    deliveryCharge: decimalToString(order.deliveryCharge),
    customerPayable: decimalToString(
      decimalWithLegacyFallback(order.customerPayable, order.totalAmount),
    ),
    courierDeduction: decimalToString(
      decimalWithLegacyFallback(order.courierDeduction, order.courierCost),
    ),
    amountReceived: decimalToString(
      decimalWithLegacyFallback(order.amountReceived, order.paidAmount),
    ),
    totalAmount: decimalToString(order.totalAmount),
    paidAmount: decimalToString(order.paidAmount),
    dueAmount: decimalToString(order.dueAmount),
    productCost: decimalToString(order.productCost),
    grossProfit: decimalToString(order.grossProfit),
    netProfit: decimalToString(
      decimalWithLegacyFallback(order.netProfit, order.netOrderProfit),
    ),
    notes: order.notes,
    isActive: order.isActive,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productVariantId: item.productVariantId,
      purchaseItemId: item.purchaseItemId,
      productName: item.productVariant.product.name,
      variantName: item.productVariant.name,
      sku: item.productVariant.sku,
      currentStock: item.productVariant.currentStock,
      purchaseRef: item.purchaseItem?.purchase.referenceNumber ?? null,
      purchaseSupplierName: item.purchaseItem?.purchase.supplier?.name ?? null,
      purchaseCountry: item.purchaseItem?.purchase.country ?? null,
      purchaseItemReceivedQuantity: item.purchaseItem?.receivedQuantity ?? null,
      purchaseItemReservedPreOrderQuantity:
        item.purchaseItem?.reservedPreOrderQuantity ?? null,
      quantity: item.quantity,
      unitSellingPrice: decimalToString(item.unitSellingPrice),
      unitCost: decimalToString(item.unitCost),
      totalSellingPrice: decimalToString(item.totalSellingPrice),
      totalCost: decimalToString(item.totalCost),
      profit: decimalToString(item.profit),
    })),
  };
}

const orderInclude = {
  items: {
    include: {
      productVariant: {
        include: {
          product: true,
        },
      },
      purchaseItem: {
        include: {
          purchase: {
            include: {
              supplier: true,
            },
          },
        },
      },
    },
    orderBy: { id: "asc" as const },
  },
} as const;

async function generateOrderNumber(tx: Prisma.TransactionClient) {
  const today = new Date();
  const stamp = today.toISOString().slice(0, 10).replaceAll("-", "");
  const count = await tx.order.count({
    where: {
      createdAt: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
    },
  });

  return `ORD-${stamp}-${String(count + 1).padStart(4, "0")}`;
}

export async function getOrdersPageData(): Promise<OrdersPageData> {
  const [orders, variants, purchaseItems] = await Promise.all([
    prisma.order.findMany({
      orderBy: { orderDate: "desc" },
      include: orderInclude,
    }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
      include: { product: true },
    }),
    prisma.purchaseItem.findMany({
      where: {
        OR: [
          {
            purchase: {
              status: {
                in: [
                  PurchaseStatus.ORDERED,
                  PurchaseStatus.IN_CARGO,
                  PurchaseStatus.PARTIALLY_RECEIVED,
                ],
              },
            },
          },
          {
            reservedPreOrderQuantity: { gt: 0 },
            purchase: { status: PurchaseStatus.RECEIVED },
          },
        ],
      },
      orderBy: [
        { productVariant: { product: { name: "asc" } } },
        { productVariant: { name: "asc" } },
        { createdAt: "desc" },
      ],
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
        purchase: { include: { supplier: true } },
      },
    }),
  ]);

  return {
    orders: orders.map(orderToView),
    variantOptions: variants.map((variant) => ({
      id: variant.id,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku,
      currentStock: variant.currentStock,
      currentLandedCost: decimalToString(variant.currentLandedCost),
      defaultSellingPrice: variant.defaultSellingPrice
        ? decimalToString(variant.defaultSellingPrice)
        : null,
    })),
    preOrderPurchaseItems: purchaseItems
      .map<PreOrderPurchaseItemOption>((item) => ({
        id: item.id,
        purchaseId: item.purchaseId,
        purchaseRef: item.purchase.referenceNumber,
        purchaseStatus: item.purchase.status,
        supplierName: item.purchase.supplier?.name ?? null,
        country: item.purchase.country ?? null,
        productVariantId: item.productVariantId,
        productName: item.productVariant.product.name,
        variantName: item.productVariant.name,
        sku: item.productVariant.sku,
        brandName: item.productVariant.product.brand?.name ?? null,
        categoryName: item.productVariant.product.category?.name ?? null,
        quantity: item.quantity,
        receivedQuantity: item.receivedQuantity,
        reservedPreOrderQuantity: item.reservedPreOrderQuantity,
        availableIncomingQuantity: Math.max(
          0,
          item.quantity - item.receivedQuantity - item.reservedPreOrderQuantity,
        ),
        finalUnitLandedCostBdt: decimalToString(item.finalUnitLandedCostBdt),
        suggestedSellingPrice: item.suggestedSellingPrice
          ? decimalToString(item.suggestedSellingPrice)
          : null,
      }))
      .filter((item) => item.availableIncomingQuantity > 0 || item.reservedPreOrderQuantity > 0),
  };
}

export async function getOrderById(id: number) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order) {
    throw new OrderServiceError("Order not found.", 404);
  }

  return orderToView(order);
}

export async function createOrder(input: CreateOrderInput, user: Actor) {
  return prisma.$transaction(async (tx) => {
    const isPreOrder = input.orderType === OrderType.PRE_ORDER;
    const status = isPreOrder
      ? OrderStatus.PRE_ORDERED
      : input.status ?? OrderStatus.CONFIRMED;
    const shouldReserveStock = isPreOrder && status !== OrderStatus.CANCELLED;
    const shouldReduceStock = !isPreOrder && status !== OrderStatus.CANCELLED;

    const variantIds = input.items.map((item) => item.productVariantId);
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        name: true,
        currentStock: true,
        currentLandedCost: true,
        defaultSellingPrice: true,
        product: { select: { name: true } },
      },
    });
    const variantById = new Map(variants.map((variant) => [variant.id, variant]));

    const purchaseItemIds = input.items
      .map((item) => item.purchaseItemId)
      .filter((id): id is number => Boolean(id));
    const purchaseItems = purchaseItemIds.length
      ? await tx.purchaseItem.findMany({
          where: {
            id: { in: purchaseItemIds },
            purchase: { status: { not: PurchaseStatus.CANCELLED } },
          },
          include: { purchase: true },
        })
      : [];
    const purchaseItemById = new Map(purchaseItems.map((item) => [item.id, item]));

    const normalizedItems = input.items.map((item) => {
      const variant = variantById.get(item.productVariantId);

      if (!variant) {
        throw new OrderServiceError("Selected product variant not found.", 404);
      }

      if (shouldReduceStock && item.quantity > variant.currentStock) {
        throw new OrderServiceError("Normal order quantity cannot exceed current stock.");
      }

      if (isPreOrder) {
        const itemSource =
          item.source ??
          (item.purchaseItemId ? "INCOMING_PURCHASE" : "CURRENT_STOCK");
        const purchaseItem = item.purchaseItemId
          ? purchaseItemById.get(item.purchaseItemId)
          : null;
        const itemName = `${variant.product.name} ${variant.name}`.trim();

        if (itemSource === "INCOMING_PURCHASE") {
          if (!item.purchaseItemId || !purchaseItem) {
            throw new OrderServiceError(`Please select a valid incoming source for ${itemName}.`);
          }
          if (purchaseItem.productVariantId !== item.productVariantId) {
            throw new OrderServiceError(`${itemName} does not match the selected purchase batch.`);
          }

          const availableIncomingQuantity =
            purchaseItem.quantity -
            purchaseItem.receivedQuantity -
            purchaseItem.reservedPreOrderQuantity;

          if (item.quantity > availableIncomingQuantity) {
            throw new OrderServiceError(
              `${itemName} has only ${Math.max(0, availableIncomingQuantity)} available from this batch.`,
            );
          }

          return {
            ...item,
            unitCost: Number(purchaseItem.finalUnitLandedCostBdt),
          };
        }

        return {
          ...item,
          purchaseItemId: null,
          unitCost: Number(variant.currentLandedCost ?? item.unitCost ?? 0),
        };
      }

      return {
        ...item,
        unitCost: item.unitCost ?? Number(variant.currentLandedCost ?? 0),
      };
    });

    if (isPreOrder) {
      const requestedIncoming = new Map<number, number>();
      const requestedStock = new Map<number, number>();

      for (const item of normalizedItems) {
        if (item.purchaseItemId) {
          requestedIncoming.set(
            item.purchaseItemId,
            (requestedIncoming.get(item.purchaseItemId) ?? 0) + item.quantity,
          );
        } else {
          requestedStock.set(
            item.productVariantId,
            (requestedStock.get(item.productVariantId) ?? 0) + item.quantity,
          );
        }
      }

      for (const [purchaseItemId, requestedQuantity] of requestedIncoming) {
        const purchaseItem = purchaseItemById.get(purchaseItemId);
        const variant = purchaseItem
          ? variantById.get(purchaseItem.productVariantId)
          : null;
        const available = purchaseItem
          ? Math.max(
              0,
              purchaseItem.quantity -
                purchaseItem.receivedQuantity -
                purchaseItem.reservedPreOrderQuantity,
            )
          : 0;

        if (!purchaseItem || requestedQuantity > available) {
          const itemName = variant
            ? `${variant.product.name} ${variant.name}`.trim()
            : "Selected item";
          throw new OrderServiceError(
            `${itemName} has only ${available} available from this batch.`,
          );
        }
      }

      for (const [variantId, requestedQuantity] of requestedStock) {
        const variant = variantById.get(variantId);

        if (!variant || requestedQuantity > variant.currentStock) {
          const itemName = variant
            ? `${variant.product.name} ${variant.name}`.trim()
            : "Selected item";
          throw new OrderServiceError(
            `${itemName} has only ${variant?.currentStock ?? 0} available in current stock.`,
          );
        }
      }
    }

    const calculationItems = normalizedItems.map((item) => ({
      quantity: item.quantity,
      unitSellingPrice: item.unitSellingPrice,
      unitCost: item.unitCost ?? 0,
    }));
    const totals = isPreOrder
      ? calculatePreOrderTotals(calculationItems, input.amountReceived, input.paidAmount)
      : calculateOrderTotals(
          calculationItems,
          input.discountAmount,
          input.deliveryCharge,
          input.courierDeduction,
          input.amountReceived,
          input.paidAmount,
        );

    if (totals.received.isNegative()) {
      throw new OrderServiceError("Amount received cannot be negative.");
    }

    const order = await tx.order.create({
      data: {
        orderNumber: await generateOrderNumber(tx),
        orderType: input.orderType,
        status,
        paymentStatus: input.paymentStatus,
        source: input.source,
        customerName: optionalText(input.customerName),
        customerPhone: optionalText(input.customerPhone),
        customerAddress: optionalText(input.customerAddress),
        orderDate: input.orderDate,
        orderedAt: input.orderDate,
        notes: optionalText(input.notes),
        subtotal: totals.subtotal,
        discountAmount: totals.discount,
        discount: totals.discount,
        deliveryCharge: totals.delivery,
        deliveryChargeCollected: totals.delivery,
        courierCost: totals.courier,
        courierDeduction: totals.courier,
        totalAmount: totals.totalAmount,
        customerPayable: totals.customerPayable,
        paidAmount: totals.received,
        amountReceived: totals.received,
        dueAmount: totals.dueAmount,
        productCost: totals.productCost,
        totalProductCost: totals.productCost,
        grossProfit: totals.grossProfit,
        netOrderProfit: totals.netProfit,
        netProfit: totals.netProfit,
        createdById: user.id,
        updatedById: user.id,
        items: {
          create: normalizedItems.map((item) => {
            const unitSellingPrice = new Prisma.Decimal(item.unitSellingPrice);
            const unitCost = new Prisma.Decimal(item.unitCost ?? 0);
            const totalSellingPrice = unitSellingPrice.mul(item.quantity);
            const totalCost = unitCost.mul(item.quantity);

            return {
              productVariantId: item.productVariantId,
              purchaseItemId: isPreOrder ? item.purchaseItemId : null,
              quantity: item.quantity,
              unitSellingPrice,
              unitCost,
              totalSellingPrice,
              totalCost,
              profit: totalSellingPrice.sub(totalCost),
            };
          }),
        },
      },
      include: orderInclude,
    });

    if (shouldReserveStock) {
      for (const item of normalizedItems) {
        if (item.purchaseItemId) {
          await tx.purchaseItem.update({
            where: { id: item.purchaseItemId },
            data: {
              reservedPreOrderQuantity: { increment: item.quantity },
            },
          });
        }
      }
    } else if (shouldReduceStock) {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productVariantId: item.productVariantId,
            orderId: order.id,
            orderItemId: item.id,
            type: StockMovementType.SALE,
            direction: StockMovementDirection.OUT,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            note: `Order ${order.orderNumber}`,
            createdById: user.id,
          },
        });
      }
    }

    return orderToView(order);
  });
}

async function orderHasSaleMovements(tx: Prisma.TransactionClient, orderId: number) {
  const count = await tx.stockMovement.count({
    where: { orderId, type: StockMovementType.SALE },
  });
  return count > 0;
}

export async function updateOrder(id: number, input: UpdateOrderInput, user: Actor) {
  return prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!existingOrder) {
      throw new OrderServiceError("Order not found.", 404);
    }

    const hadSaleMovements = await orderHasSaleMovements(tx, existingOrder.id);

    if (existingOrder.orderType === OrderType.PRE_ORDER && hadSaleMovements) {
      throw new OrderServiceError("Fulfilled pre-orders cannot be edited.");
    }

    if (
      existingOrder.orderType === OrderType.PRE_ORDER &&
      input.orderType !== OrderType.PRE_ORDER
    ) {
      throw new OrderServiceError("A pre-order must remain a pre-order while editing.");
    }

    if (existingOrder.orderType !== input.orderType && hadSaleMovements) {
      throw new OrderServiceError("Order type cannot be changed after stock movement.");
    }

    const isPreOrder = input.orderType === OrderType.PRE_ORDER;
    const status =
      input.status ??
      (isPreOrder ? OrderStatus.PRE_ORDERED : existingOrder.status);
    if (
      isPreOrder &&
      (status === OrderStatus.READY_TO_DELIVER || status === OrderStatus.DELIVERED)
    ) {
      throw new OrderServiceError("Use Fulfill Pre-order to update delivery and payment details.");
    }
    const wasCancelled = existingOrder.status === OrderStatus.CANCELLED;
    const isCancelled = status === OrderStatus.CANCELLED;
    const shouldReserveStock = isPreOrder && !isCancelled;
    const shouldReduceStock = !isPreOrder && !isCancelled;

    const oldSoldByVariant = new Map<number, number>();
    const oldReservedByPurchaseItem = new Map<number, number>();

    for (const item of existingOrder.items) {
      if (hadSaleMovements && !wasCancelled) {
        oldSoldByVariant.set(
          item.productVariantId,
          (oldSoldByVariant.get(item.productVariantId) ?? 0) + item.quantity,
        );
      } else if (
        !wasCancelled &&
        existingOrder.orderType === OrderType.PRE_ORDER &&
        item.purchaseItemId
      ) {
        oldReservedByPurchaseItem.set(
          item.purchaseItemId,
          (oldReservedByPurchaseItem.get(item.purchaseItemId) ?? 0) + item.quantity,
        );
      }
    }

    const variantIds = input.items.map((item) => item.productVariantId);
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        name: true,
        currentStock: true,
        currentLandedCost: true,
        defaultSellingPrice: true,
        product: { select: { name: true } },
      },
    });
    const variantById = new Map(variants.map((variant) => [variant.id, variant]));

    const purchaseItemIds = input.items
      .map((item) => item.purchaseItemId)
      .filter((purchaseItemId): purchaseItemId is number => Boolean(purchaseItemId));
    const purchaseItems = purchaseItemIds.length
      ? await tx.purchaseItem.findMany({
          where: {
            id: { in: purchaseItemIds },
            purchase: { status: { not: PurchaseStatus.CANCELLED } },
          },
          include: { purchase: true },
        })
      : [];
    const purchaseItemById = new Map(purchaseItems.map((item) => [item.id, item]));
    const existingItemById = new Map(
      existingOrder.items.map((item) => [item.id, item]),
    );

    const normalizedItems = input.items.map((item) => {
      const variant = variantById.get(item.productVariantId);

      if (!variant) {
        throw new OrderServiceError("Selected product variant not found.", 404);
      }
      const itemName = `${variant.product.name} ${variant.name}`.trim();
      const existingItem = item.orderItemId
        ? existingItemById.get(item.orderItemId)
        : null;

      if (item.orderItemId && !existingItem) {
        throw new OrderServiceError(`${itemName} is not part of this order.`);
      }

      const availableStock =
        variant.currentStock + (oldSoldByVariant.get(item.productVariantId) ?? 0);

      if (shouldReduceStock && item.quantity > availableStock) {
        throw new OrderServiceError(
          `${itemName} has only ${availableStock} available in current stock.`,
        );
      }

      if (isPreOrder) {
        const itemSource =
          item.source ??
          (item.purchaseItemId ? "INCOMING_PURCHASE" : "CURRENT_STOCK");
        const purchaseItem = item.purchaseItemId
          ? purchaseItemById.get(item.purchaseItemId)
          : null;

        if (itemSource === "INCOMING_PURCHASE") {
          if (!item.purchaseItemId || !purchaseItem) {
            throw new OrderServiceError(`Please select a valid source for ${itemName}.`);
          }
          if (purchaseItem.productVariantId !== item.productVariantId) {
            throw new OrderServiceError(`${itemName} does not match the selected purchase batch.`);
          }

          const sourceUnchanged =
            existingItem?.productVariantId === item.productVariantId &&
            existingItem.purchaseItemId === purchaseItem.id;
          return {
            ...item,
            purchaseItemId: purchaseItem.id,
            unitCost: sourceUnchanged
              ? Number(existingItem.unitCost)
              : Number(purchaseItem.finalUnitLandedCostBdt),
          };
        }

        const sourceUnchanged =
          existingItem?.productVariantId === item.productVariantId &&
          existingItem.purchaseItemId === null;
        return {
          ...item,
          purchaseItemId: null,
          unitCost: sourceUnchanged
            ? Number(existingItem.unitCost)
            : Number(variant.currentLandedCost ?? 0),
        };
      }

      return {
        ...item,
        purchaseItemId: null,
        unitCost: item.unitCost ?? Number(variant.currentLandedCost ?? 0),
      };
    });

    if (isPreOrder) {
      const requestedIncoming = new Map<number, number>();
      const requestedStock = new Map<number, number>();

      for (const item of normalizedItems) {
        if (item.purchaseItemId) {
          requestedIncoming.set(
            item.purchaseItemId,
            (requestedIncoming.get(item.purchaseItemId) ?? 0) + item.quantity,
          );
        } else {
          requestedStock.set(
            item.productVariantId,
            (requestedStock.get(item.productVariantId) ?? 0) + item.quantity,
          );
        }
      }

      for (const [purchaseItemId, requestedQuantity] of requestedIncoming) {
        const purchaseItem = purchaseItemById.get(purchaseItemId);
        const variant = purchaseItem
          ? variantById.get(purchaseItem.productVariantId)
          : null;
        const available = purchaseItem
          ? Math.max(
              0,
              purchaseItem.quantity -
                purchaseItem.receivedQuantity -
                purchaseItem.reservedPreOrderQuantity,
            ) + (oldReservedByPurchaseItem.get(purchaseItemId) ?? 0)
          : 0;

        if (!purchaseItem || requestedQuantity > available) {
          const itemName = variant
            ? `${variant.product.name} ${variant.name}`.trim()
            : "Selected item";
          throw new OrderServiceError(
            `${itemName} has only ${available} available from this batch.`,
          );
        }
      }

      for (const [variantId, requestedQuantity] of requestedStock) {
        const variant = variantById.get(variantId);

        if (!variant || requestedQuantity > variant.currentStock) {
          const itemName = variant
            ? `${variant.product.name} ${variant.name}`.trim()
            : "Selected item";
          throw new OrderServiceError(
            `${itemName} has only ${variant?.currentStock ?? 0} available in current stock.`,
          );
        }
      }
    }

    const calculationItems = normalizedItems.map((item) => ({
      quantity: item.quantity,
      unitSellingPrice: item.unitSellingPrice,
      unitCost: item.unitCost ?? 0,
    }));
    const totals = isPreOrder
      ? calculatePreOrderTotals(calculationItems, input.amountReceived, input.paidAmount)
      : calculateOrderTotals(
          calculationItems,
          input.discountAmount,
          input.deliveryCharge,
          input.courierDeduction,
          input.amountReceived,
          input.paidAmount,
        );

    if (totals.received.isNegative()) {
      throw new OrderServiceError("Amount received cannot be negative.");
    }

    if (!wasCancelled) {
      if (hadSaleMovements) {
        for (const item of existingOrder.items) {
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: { currentStock: { increment: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productVariantId: item.productVariantId,
              orderId: existingOrder.id,
              orderItemId: item.id,
              type: StockMovementType.RETURN,
              direction: StockMovementDirection.IN,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.totalCost,
              note: isCancelled
                ? `Cancelled order ${existingOrder.orderNumber}`
                : `Edited order ${existingOrder.orderNumber}: restored previous item`,
              createdById: user.id,
            },
          });
        }
      }
    }

    if (
      !wasCancelled &&
      !hadSaleMovements &&
      existingOrder.orderType === OrderType.PRE_ORDER
    ) {
      const nextReservedByPurchaseItem = new Map<number, number>();

      if (shouldReserveStock) {
        for (const item of normalizedItems) {
          if (item.purchaseItemId) {
            nextReservedByPurchaseItem.set(
              item.purchaseItemId,
              (nextReservedByPurchaseItem.get(item.purchaseItemId) ?? 0) + item.quantity,
            );
          }
        }
      }

      const affectedPurchaseItemIds = new Set([
        ...oldReservedByPurchaseItem.keys(),
        ...nextReservedByPurchaseItem.keys(),
      ]);

      for (const purchaseItemId of affectedPurchaseItemIds) {
        const previousQuantity = oldReservedByPurchaseItem.get(purchaseItemId) ?? 0;
        const nextQuantity = nextReservedByPurchaseItem.get(purchaseItemId) ?? 0;
        const difference = nextQuantity - previousQuantity;

        if (difference !== 0) {
          await tx.purchaseItem.update({
            where: { id: purchaseItemId },
            data: {
              reservedPreOrderQuantity:
                difference > 0
                  ? { increment: difference }
                  : { decrement: Math.abs(difference) },
            },
          });
        }
      }
    }

    await tx.orderItem.deleteMany({ where: { orderId: existingOrder.id } });

    const updatedOrder = await tx.order.update({
      where: { id: existingOrder.id },
      data: {
        orderType: input.orderType,
        status,
        paymentStatus: input.paymentStatus,
        source: input.source,
        customerName: optionalText(input.customerName),
        customerPhone: optionalText(input.customerPhone),
        customerAddress: optionalText(input.customerAddress),
        orderDate: input.orderDate,
        orderedAt: input.orderDate,
        deliveredAt: status === OrderStatus.DELIVERED ? existingOrder.deliveredAt ?? new Date() : null,
        notes: optionalText(input.notes),
        subtotal: totals.subtotal,
        discountAmount: totals.discount,
        discount: totals.discount,
        deliveryCharge: totals.delivery,
        deliveryChargeCollected: totals.delivery,
        courierCost: totals.courier,
        courierDeduction: totals.courier,
        totalAmount: totals.totalAmount,
        customerPayable: totals.customerPayable,
        paidAmount: totals.received,
        amountReceived: totals.received,
        dueAmount: totals.dueAmount,
        productCost: totals.productCost,
        totalProductCost: totals.productCost,
        grossProfit: totals.grossProfit,
        netOrderProfit: totals.netProfit,
        netProfit: totals.netProfit,
        updatedById: user.id,
        items: {
          create: normalizedItems.map((item) => {
            const unitSellingPrice = new Prisma.Decimal(item.unitSellingPrice);
            const unitCost = new Prisma.Decimal(item.unitCost ?? 0);
            const totalSellingPrice = unitSellingPrice.mul(item.quantity);
            const totalCost = unitCost.mul(item.quantity);

            return {
              productVariantId: item.productVariantId,
              purchaseItemId: isPreOrder ? item.purchaseItemId : null,
              quantity: item.quantity,
              unitSellingPrice,
              unitCost,
              totalSellingPrice,
              totalCost,
              profit: totalSellingPrice.sub(totalCost),
            };
          }),
        },
      },
      include: orderInclude,
    });

    if (shouldReduceStock) {
      for (const item of updatedOrder.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productVariantId: item.productVariantId,
            orderId: updatedOrder.id,
            orderItemId: item.id,
            type: StockMovementType.SALE,
            direction: StockMovementDirection.OUT,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            note: `Edited order ${updatedOrder.orderNumber}: updated item`,
            createdById: user.id,
          },
        });
      }
    }

    return orderToView(updatedOrder);
  });
}

export async function updateOrderStatus(
  id: number,
  input: UpdateOrderStatusInput,
  user: Actor,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new OrderServiceError("Order not found.", 404);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new OrderServiceError("Cancelled orders cannot be updated.");
    }

    if (
      order.orderType === OrderType.PRE_ORDER &&
      (input.status === OrderStatus.READY_TO_DELIVER ||
        input.status === OrderStatus.DELIVERED)
    ) {
      const hasSaleMovements = await orderHasSaleMovements(tx, order.id);

      if (!hasSaleMovements) {
        throw new OrderServiceError("Use Fulfill Pre-order to update delivery and payment details.");
      }
    }

    if (input.status === OrderStatus.CANCELLED) {
      const hadSaleMovements = await orderHasSaleMovements(tx, order.id);

      if (hadSaleMovements) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: { currentStock: { increment: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productVariantId: item.productVariantId,
              orderId: order.id,
              orderItemId: item.id,
              type: StockMovementType.RETURN,
              direction: StockMovementDirection.IN,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.totalCost,
              note: `Cancelled order ${order.orderNumber}`,
              createdById: user.id,
            },
          });
        }
      } else if (order.orderType === OrderType.PRE_ORDER) {
        for (const item of order.items) {
          if (item.purchaseItemId) {
            await tx.purchaseItem.update({
              where: { id: item.purchaseItemId },
              data: { reservedPreOrderQuantity: { decrement: item.quantity } },
            });
          }
        }
      }
    }

    const updatedOrder = await tx.order.update({
      where: { id },
      data: {
        status: input.status,
        deliveredAt: input.status === OrderStatus.DELIVERED ? new Date() : undefined,
        updatedById: user.id,
      },
      include: orderInclude,
    });

    return orderToView(updatedOrder);
  });
}

export async function fulfillPreOrder(
  id: number,
  input: FulfillPreOrderInput,
  user: Actor,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new OrderServiceError("Order not found.", 404);
    }

    if (order.orderType !== OrderType.PRE_ORDER) {
      throw new OrderServiceError("Only pre-orders can be fulfilled.");
    }

    if (
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.RETURNED
    ) {
      throw new OrderServiceError("This pre-order cannot be fulfilled.");
    }

    // A READY_TO_DELIVER pre-order already has its sale movements. Allow its
    // delivery/payment details to be finalized without deducting stock again.
    const hasSaleMovements = await orderHasSaleMovements(tx, order.id);

    if (!hasSaleMovements) {
      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.productVariantId },
          select: { currentStock: true },
        });

        if (!variant || variant.currentStock < item.quantity) {
          throw new OrderServiceError("Current stock is not enough to fulfill this pre-order.");
        }
      }
    }

    const calculationItems = order.items.map((item) => ({
      quantity: item.quantity,
      unitSellingPrice: Number(item.unitSellingPrice),
      unitCost: Number(item.unitCost),
    }));
    const totals = calculateOrderTotals(
      calculationItems,
      input.discountAmount,
      input.deliveryCharge,
      input.courierDeduction,
      input.amountReceived,
    );

    if (totals.customerPayable.isNegative()) {
      throw new OrderServiceError("Discount cannot be greater than product subtotal.");
    }

    if (totals.courier.gt(totals.customerPayable.add(totals.delivery))) {
      throw new OrderServiceError("COD/courier fee cannot exceed customer payable plus delivery charge.");
    }

    if (totals.received.isNegative()) {
      throw new OrderServiceError("Amount received cannot be negative.");
    }

    if (!hasSaleMovements) {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productVariantId: item.productVariantId,
            orderId: order.id,
            orderItemId: item.id,
            type: StockMovementType.SALE,
            direction: StockMovementDirection.OUT,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            note: `Fulfilled pre-order ${order.orderNumber}`,
            createdById: user.id,
          },
        });

        if (item.purchaseItemId) {
          await tx.purchaseItem.update({
            where: { id: item.purchaseItemId },
            data: { reservedPreOrderQuantity: { decrement: item.quantity } },
          });
        }
      }
    }

    const updatedOrder = await tx.order.update({
      where: { id },
      data: {
        status: input.finalStatus,
        customerName: optionalText(input.customerName),
        customerPhone: optionalText(input.customerPhone),
        customerAddress: optionalText(input.customerAddress),
        paymentStatus: input.paymentStatus,
        discountAmount: totals.discount,
        discount: totals.discount,
        deliveryCharge: totals.delivery,
        deliveryChargeCollected: totals.delivery,
        courierCost: totals.courier,
        courierDeduction: totals.courier,
        totalAmount: totals.totalAmount,
        customerPayable: totals.customerPayable,
        paidAmount: totals.received,
        amountReceived: totals.received,
        dueAmount: totals.dueAmount,
        productCost: totals.productCost,
        totalProductCost: totals.productCost,
        grossProfit: totals.grossProfit,
        netOrderProfit: totals.netProfit,
        netProfit: totals.netProfit,
        notes: optionalText(input.notes),
        deliveredAt: input.finalStatus === OrderStatus.DELIVERED ? new Date() : null,
        updatedById: user.id,
      },
      include: orderInclude,
    });

    return orderToView(updatedOrder);
  });
}
