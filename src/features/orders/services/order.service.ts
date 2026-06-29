import {
  OrderStatus,
  OrderType,
  OrderDeliveryStatus,
  OrderItemFulfillmentStatus,
  PaymentStatus,
  Prisma,
  PurchaseStatus,
  StockMovementDirection,
  StockMovementType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  CompleteOrderDeliveryInput,
  CreateOrderFromPreOrderItemsInput,
  CreateOrderInput,
  DeliverPreOrderItemsInput,
  FulfillPreOrderInput,
  UpdateOrderInput,
  UpdateOrderStatusInput,
} from "../schemas/order.schema";
import type {
  OrderDeliveryView,
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

function sumDecimals(values: Prisma.Decimal[]) {
  return values.reduce((total, value) => total.add(value), new Prisma.Decimal(0));
}

function zeroIfNegative(value: Prisma.Decimal) {
  return value.isNegative() ? new Prisma.Decimal(0) : value;
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
  sourcePreOrderId: number | null;
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
  deliveryBatches?: Array<{
    status: OrderDeliveryStatus;
    amountReceived: Prisma.Decimal;
    netProfit: Prisma.Decimal;
  }>;
  notes: string | null;
  sourcePreOrder: { orderNumber: string } | null;
  generatedOrders?: Array<{
    id: number;
    orderNumber: string;
    status: OrderStatus;
    amountReceived: Prisma.Decimal;
    netProfit: Prisma.Decimal | null;
    netOrderProfit: Prisma.Decimal | null;
  }>;
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
    fulfillmentStatus: OrderItemFulfillmentStatus;
    deliveredQuantity: number;
    deliveredAt: Date | null;
    transferredToOrderId: number | null;
    transferredAt: Date | null;
    transferredToOrder: { orderNumber: string } | null;
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
  const generatedOrders = order.generatedOrders ?? [];
  const preOrderCollectedAmount = sumDecimals([
    decimalWithLegacyFallback(order.amountReceived, order.paidAmount) ?? new Prisma.Decimal(0),
    ...generatedOrders.map((generatedOrder) => generatedOrder.amountReceived),
  ]);
  const undeliveredItems = order.items.filter(
    (item) =>
      item.fulfillmentStatus !== OrderItemFulfillmentStatus.DELIVERED &&
      item.fulfillmentStatus !== OrderItemFulfillmentStatus.MOVED_TO_ORDER &&
      item.fulfillmentStatus !== OrderItemFulfillmentStatus.IN_DELIVERY &&
      item.fulfillmentStatus !== OrderItemFulfillmentStatus.CANCELLED &&
      item.fulfillmentStatus !== OrderItemFulfillmentStatus.RETURNED,
  );
  const remainingSubtotal = sumDecimals(
    undeliveredItems.map((item) => item.totalSellingPrice),
  );
  const remainingCost = sumDecimals(undeliveredItems.map((item) => item.totalCost));
  const preOrderRemainingDue = zeroIfNegative(
    remainingSubtotal.sub(preOrderCollectedAmount),
  );
  const preOrderRemainingExpectedProfit = remainingSubtotal.sub(remainingCost);
  const preOrderRealizedProfit = sumDecimals(
    generatedOrders
      .filter((generatedOrder) => generatedOrder.status === OrderStatus.DELIVERED)
      .map((generatedOrder) =>
        decimalWithLegacyFallback(
          generatedOrder.netProfit,
          generatedOrder.netOrderProfit,
        ) ?? new Prisma.Decimal(0),
      ),
  );
  const movedItems = order.items.filter(
    (item) => item.fulfillmentStatus === OrderItemFulfillmentStatus.MOVED_TO_ORDER,
  );
  const movedOrderNumbers = Array.from(
    new Set(
      movedItems
        .map((item) => item.transferredToOrder?.orderNumber)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    sourcePreOrderId: order.sourcePreOrderId,
    sourcePreOrderNumber: order.sourcePreOrder?.orderNumber ?? null,
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
    preOrderCollectedAmount: decimalToString(preOrderCollectedAmount),
    preOrderRemainingDue: decimalToString(preOrderRemainingDue),
    preOrderRemainingExpectedProfit: decimalToString(preOrderRemainingExpectedProfit),
    preOrderMovedItemCount: movedItems.length,
    preOrderMovedItemSummary: movedOrderNumbers.length
      ? `${movedItems.length} item${movedItems.length === 1 ? "" : "s"} moved to ${movedOrderNumbers.join(", ")}`
      : movedItems.length
        ? `${movedItems.length} item${movedItems.length === 1 ? "" : "s"} moved to order`
        : null,
    preOrderRealizedProfit: decimalToString(preOrderRealizedProfit),
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
      fulfillmentStatus: item.fulfillmentStatus,
      deliveredQuantity: item.deliveredQuantity,
      deliveredAt: item.deliveredAt?.toISOString() ?? null,
      transferredToOrderId: item.transferredToOrderId,
      transferredToOrderNumber: item.transferredToOrder?.orderNumber ?? null,
      transferredAt: item.transferredAt?.toISOString() ?? null,
    })),
  };
}

const deliveryInclude = {
  order: true,
  items: {
    include: {
      orderItem: {
        include: {
          productVariant: {
            include: { product: true },
          },
        },
      },
    },
    orderBy: { id: "asc" as const },
  },
} as const;

function deliveryToView(delivery: {
  id: number;
  orderId: number;
  deliveryNumber: string;
  status: OrderDeliveryStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  paymentStatus: PaymentStatus;
  discountAmount: Prisma.Decimal;
  deliveryCharge: Prisma.Decimal;
  courierDeduction: Prisma.Decimal;
  amountReceived: Prisma.Decimal;
  customerPayable: Prisma.Decimal;
  productCost: Prisma.Decimal;
  netProfit: Prisma.Decimal;
  notes: string | null;
  deliveredAt: Date | null;
  createdAt: Date;
  order: { orderNumber: string };
  items: Array<{
    id: number;
    orderItemId: number;
    quantity: number;
    unitSellingPrice: Prisma.Decimal;
    unitCost: Prisma.Decimal;
    totalSellingPrice: Prisma.Decimal;
    totalCost: Prisma.Decimal;
    profit: Prisma.Decimal;
    orderItem: {
      productVariant: {
        name: string;
        sku: string | null;
        product: { name: string };
      };
    };
  }>;
}): OrderDeliveryView {
  return {
    id: delivery.id,
    orderId: delivery.orderId,
    orderNumber: delivery.order.orderNumber,
    deliveryNumber: delivery.deliveryNumber,
    status: delivery.status,
    customerName: delivery.customerName,
    customerPhone: delivery.customerPhone,
    customerAddress: delivery.customerAddress,
    paymentStatus: delivery.paymentStatus,
    discountAmount: decimalToString(delivery.discountAmount),
    deliveryCharge: decimalToString(delivery.deliveryCharge),
    courierDeduction: decimalToString(delivery.courierDeduction),
    amountReceived: decimalToString(delivery.amountReceived),
    customerPayable: decimalToString(delivery.customerPayable),
    productCost: decimalToString(delivery.productCost),
    netProfit: decimalToString(delivery.netProfit),
    notes: delivery.notes,
    deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
    createdAt: delivery.createdAt.toISOString(),
    items: delivery.items.map((item) => ({
      id: item.id,
      orderItemId: item.orderItemId,
      productName: item.orderItem.productVariant.product.name,
      variantName: item.orderItem.productVariant.name,
      sku: item.orderItem.productVariant.sku,
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
  sourcePreOrder: { select: { orderNumber: true } },
  generatedOrders: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      amountReceived: true,
      netProfit: true,
      netOrderProfit: true,
    },
  },
  deliveryBatches: {
    select: {
      status: true,
      amountReceived: true,
      netProfit: true,
    },
  },
  items: {
    include: {
      productVariant: {
        include: {
          product: true,
        },
      },
      transferredToOrder: { select: { orderNumber: true } },
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

async function generateDeliveryNumber(tx: Prisma.TransactionClient, orderNumber: string) {
  const count = await tx.orderDelivery.count({
    where: { order: { orderNumber } },
  });

  return orderNumber + "-D" + String(count + 1).padStart(2, "0");
}

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

function getPreOrderSummaryStatus(
  items: Array<{ fulfillmentStatus: OrderItemFulfillmentStatus }>,
) {
  const activeItems = items.filter(
    (item) =>
      item.fulfillmentStatus !== OrderItemFulfillmentStatus.MOVED_TO_ORDER &&
      item.fulfillmentStatus !== OrderItemFulfillmentStatus.CANCELLED &&
      item.fulfillmentStatus !== OrderItemFulfillmentStatus.RETURNED,
  );

  if (!activeItems.length) {
    return OrderStatus.PRE_ORDERED;
  }

  const deliveredCount = activeItems.filter(
    (item) => item.fulfillmentStatus === OrderItemFulfillmentStatus.DELIVERED,
  ).length;

  if (deliveredCount === activeItems.length) {
    return OrderStatus.DELIVERED;
  }

  if (deliveredCount > 0) {
    return OrderStatus.PARTIALLY_DELIVERED;
  }

  if (
    activeItems.some(
      (item) =>
        item.fulfillmentStatus === OrderItemFulfillmentStatus.READY ||
        item.fulfillmentStatus === OrderItemFulfillmentStatus.IN_DELIVERY,
    )
  ) {
    return OrderStatus.READY_TO_DELIVER;
  }

  return OrderStatus.PRE_ORDERED;
}

function getDeliverableQuantity(item: { quantity: number; deliveredQuantity: number }) {
  return Math.max(0, item.quantity - item.deliveredQuantity);
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
    deliveryBatches: [],
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
      imageUrl: variant.imageUrl,
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
        imageUrl: item.productVariant.imageUrl,
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
              fulfillmentStatus: isPreOrder
                ? item.purchaseItemId
                  ? OrderItemFulfillmentStatus.WAITING
                  : OrderItemFulfillmentStatus.READY
                : shouldReduceStock
                  ? OrderItemFulfillmentStatus.DELIVERED
                  : OrderItemFulfillmentStatus.CANCELLED,
              deliveredQuantity: shouldReduceStock ? item.quantity : 0,
              deliveredAt: shouldReduceStock ? new Date() : null,
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

function isLockedPreOrderItemStatus(status: OrderItemFulfillmentStatus) {
  return (
    status === OrderItemFulfillmentStatus.MOVED_TO_ORDER ||
    status === OrderItemFulfillmentStatus.IN_DELIVERY ||
    status === OrderItemFulfillmentStatus.DELIVERED ||
    status === OrderItemFulfillmentStatus.CANCELLED ||
    status === OrderItemFulfillmentStatus.RETURNED
  );
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
    const lockedPreOrderItems = isPreOrder
      ? existingOrder.items.filter((item) =>
          isLockedPreOrderItemStatus(item.fulfillmentStatus),
        )
      : [];
    const lockedPreOrderItemIds = new Set(
      lockedPreOrderItems.map((item) => item.id),
    );
    const editableExistingItems = existingOrder.items.filter(
      (item) => !lockedPreOrderItemIds.has(item.id),
    );
    const editableInputItems = input.items.filter(
      (item) => !item.orderItemId || !lockedPreOrderItemIds.has(item.orderItemId),
    );

    const oldSoldByVariant = new Map<number, number>();
    const oldReservedByPurchaseItem = new Map<number, number>();

    for (const item of editableExistingItems) {
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

    const variantIds = editableInputItems.map((item) => item.productVariantId);
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

    const purchaseItemIds = editableInputItems
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

    const normalizedItems = editableInputItems.map((item) => {
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

    const calculationItems = [
      ...lockedPreOrderItems
        .filter(
          (item) =>
            item.fulfillmentStatus !== OrderItemFulfillmentStatus.CANCELLED &&
            item.fulfillmentStatus !== OrderItemFulfillmentStatus.RETURNED,
        )
        .map((item) => ({
          quantity: item.quantity,
          unitSellingPrice: Number(item.unitSellingPrice),
          unitCost: Number(item.unitCost),
        })),
      ...normalizedItems.map((item) => ({
        quantity: item.quantity,
        unitSellingPrice: item.unitSellingPrice,
        unitCost: item.unitCost ?? 0,
      })),
    ];
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

    const existingOrderItemIds = editableExistingItems.map((item) => item.id);

    if (existingOrderItemIds.length) {
      await tx.stockMovement.updateMany({
        where: { orderItemId: { in: existingOrderItemIds } },
        data: { orderItemId: null },
      });
    }

    if (existingOrderItemIds.length) {
      await tx.orderItem.deleteMany({
        where: { id: { in: existingOrderItemIds } },
      });
    }

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
              fulfillmentStatus: isPreOrder
                ? item.purchaseItemId
                  ? OrderItemFulfillmentStatus.WAITING
                  : OrderItemFulfillmentStatus.READY
                : shouldReduceStock
                  ? OrderItemFulfillmentStatus.DELIVERED
                  : OrderItemFulfillmentStatus.CANCELLED,
              deliveredQuantity: shouldReduceStock ? item.quantity : 0,
              deliveredAt: shouldReduceStock ? new Date() : null,
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
  }, {
    maxWait: 10000,
    timeout: 20000,
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

      if (hadSaleMovements && order.orderType !== OrderType.PRE_ORDER) {
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
          if (item.deliveredQuantity > 0) {
            await tx.productVariant.update({
              where: { id: item.productVariantId },
              data: { currentStock: { increment: item.deliveredQuantity } },
            });
            await tx.stockMovement.create({
              data: {
                productVariantId: item.productVariantId,
                orderId: order.id,
                orderItemId: item.id,
                type: StockMovementType.RETURN,
                direction: StockMovementDirection.IN,
                quantity: item.deliveredQuantity,
                unitCost: item.unitCost,
                totalCost: item.unitCost.mul(item.deliveredQuantity),
                note: `Cancelled pre-order ${order.orderNumber}`,
                createdById: user.id,
              },
            });
          }

          const reservedQuantity = getDeliverableQuantity(item);

          if (item.purchaseItemId && reservedQuantity > 0) {
            await tx.purchaseItem.update({
              where: { id: item.purchaseItemId },
              data: { reservedPreOrderQuantity: { decrement: reservedQuantity } },
            });
          }
        }

        await tx.orderItem.updateMany({
          where: { orderId: order.id },
          data: { fulfillmentStatus: OrderItemFulfillmentStatus.CANCELLED },
        });
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

export async function createOrderFromPreOrderItems(
  id: number,
  input: CreateOrderFromPreOrderItemsInput,
  user: Actor,
) {
  return prisma.$transaction(async (tx) => {
    const sourceOrder = await tx.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!sourceOrder) {
      throw new OrderServiceError("Pre-order not found.", 404);
    }

    if (sourceOrder.orderType !== OrderType.PRE_ORDER) {
      throw new OrderServiceError("Only pre-orders can create normal orders from items.");
    }

    const selectedItemIds = new Set(input.orderItemIds);

    if (selectedItemIds.size !== input.orderItemIds.length) {
      throw new OrderServiceError("Duplicate pre-order items cannot be selected.");
    }

    const selectedItems = sourceOrder.items.filter((item) =>
      selectedItemIds.has(item.id),
    );

    if (selectedItems.length !== selectedItemIds.size) {
      throw new OrderServiceError("Selected items do not belong to this pre-order.");
    }

    for (const item of selectedItems) {
      if (
        item.fulfillmentStatus === OrderItemFulfillmentStatus.MOVED_TO_ORDER ||
        item.fulfillmentStatus === OrderItemFulfillmentStatus.IN_DELIVERY ||
        item.fulfillmentStatus === OrderItemFulfillmentStatus.DELIVERED ||
        item.fulfillmentStatus === OrderItemFulfillmentStatus.CANCELLED ||
        item.fulfillmentStatus === OrderItemFulfillmentStatus.RETURNED
      ) {
        throw new OrderServiceError("Selected item is not available for a new order.");
      }

      const quantity = getDeliverableQuantity(item);

      if (quantity <= 0) {
        throw new OrderServiceError("Selected item has no remaining quantity.");
      }

      if (item.productVariant.currentStock < quantity) {
        throw new OrderServiceError("Selected item is still waiting for stock.");
      }
    }

    const calculationItems = selectedItems.map((item) => ({
      quantity: getDeliverableQuantity(item),
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

    const now = new Date();
    const order = await tx.order.create({
      data: {
        orderNumber: await generateOrderNumber(tx),
        orderType: OrderType.NORMAL,
        sourcePreOrderId: sourceOrder.id,
        status: OrderStatus.CONFIRMED,
        paymentStatus: input.paymentStatus,
        source: sourceOrder.source,
        customerName: optionalText(input.customerName) ?? sourceOrder.customerName,
        customerPhone: optionalText(input.customerPhone) ?? sourceOrder.customerPhone,
        customerAddress: optionalText(input.customerAddress) ?? sourceOrder.customerAddress,
        orderDate: now,
        orderedAt: now,
        notes:
          optionalText(input.notes) ??
          "Created from pre-order " + sourceOrder.orderNumber,
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
          create: selectedItems.map((item) => {
            const quantity = getDeliverableQuantity(item);
            const totalSellingPrice = item.unitSellingPrice.mul(quantity);
            const totalCost = item.unitCost.mul(quantity);

            return {
              productVariantId: item.productVariantId,
              purchaseItemId: null,
              quantity,
              unitSellingPrice: item.unitSellingPrice,
              unitCost: item.unitCost,
              totalSellingPrice,
              totalCost,
              profit: totalSellingPrice.sub(totalCost),
              fulfillmentStatus: OrderItemFulfillmentStatus.DELIVERED,
              deliveredQuantity: quantity,
              deliveredAt: now,
            };
          }),
        },
      },
      include: orderInclude,
    });

    for (const [index, sourceItem] of selectedItems.entries()) {
      const newItem = order.items[index];
      const quantity = getDeliverableQuantity(sourceItem);

      await tx.productVariant.update({
        where: { id: sourceItem.productVariantId },
        data: { currentStock: { decrement: quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productVariantId: sourceItem.productVariantId,
          orderId: order.id,
          orderItemId: newItem.id,
          type: StockMovementType.SALE,
          direction: StockMovementDirection.OUT,
          quantity,
          unitCost: sourceItem.unitCost,
          totalCost: sourceItem.unitCost.mul(quantity),
          note: "Order " + order.orderNumber + " from pre-order " + sourceOrder.orderNumber,
          createdById: user.id,
        },
      });
      await tx.orderItem.update({
        where: { id: sourceItem.id },
        data: {
          fulfillmentStatus: OrderItemFulfillmentStatus.MOVED_TO_ORDER,
          transferredToOrderId: order.id,
          transferredAt: now,
        },
      });

      if (sourceItem.purchaseItemId) {
        await tx.purchaseItem.update({
          where: { id: sourceItem.purchaseItemId },
          data: { reservedPreOrderQuantity: { decrement: quantity } },
        });
      }
    }

    const refreshedItems = await tx.orderItem.findMany({
      where: { orderId: sourceOrder.id },
      select: { fulfillmentStatus: true },
    });
    await tx.order.update({
      where: { id: sourceOrder.id },
      data: {
        status: getPreOrderSummaryStatus(refreshedItems),
        updatedById: user.id,
      },
    });

    return orderToView(order);
  });
}

export async function deliverPreOrderItems(
  id: number,
  input: DeliverPreOrderItemsInput,
  user: Actor,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) throw new OrderServiceError("Order not found.", 404);
    if (order.orderType !== OrderType.PRE_ORDER) {
      throw new OrderServiceError("Only pre-orders can create delivery batches.");
    }
    if (
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.RETURNED
    ) {
      throw new OrderServiceError("This pre-order cannot create a delivery batch.");
    }

    const selectedItemIds = new Set(input.orderItemIds);
    if (selectedItemIds.size !== input.orderItemIds.length) {
      throw new OrderServiceError("Duplicate order items cannot be added to a delivery.");
    }

    const selectedItems = order.items.filter((item) => selectedItemIds.has(item.id));
    if (selectedItems.length !== selectedItemIds.size) {
      throw new OrderServiceError("Selected items do not belong to this order.");
    }

    for (const item of selectedItems) {
      if (
        item.fulfillmentStatus === OrderItemFulfillmentStatus.IN_DELIVERY ||
        item.fulfillmentStatus === OrderItemFulfillmentStatus.DELIVERED ||
        item.fulfillmentStatus === OrderItemFulfillmentStatus.CANCELLED ||
        item.fulfillmentStatus === OrderItemFulfillmentStatus.RETURNED
      ) {
        throw new OrderServiceError("Selected item is not available for a new delivery.");
      }
      const deliverableQuantity = getDeliverableQuantity(item);
      if (deliverableQuantity <= 0) {
        throw new OrderServiceError("Selected item has no remaining quantity to deliver.");
      }
      if (item.productVariant.currentStock < deliverableQuantity) {
        throw new OrderServiceError("Selected item is still waiting for stock.");
      }
    }

    const calculationItems = selectedItems.map((item) => ({
      quantity: getDeliverableQuantity(item),
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

    const delivery = await tx.orderDelivery.create({
      data: {
        orderId: order.id,
        deliveryNumber: await generateDeliveryNumber(tx, order.orderNumber),
        status: OrderDeliveryStatus.READY_TO_DELIVER,
        customerName: optionalText(input.customerName) ?? order.customerName,
        customerPhone: optionalText(input.customerPhone) ?? order.customerPhone,
        customerAddress: optionalText(input.customerAddress) ?? order.customerAddress,
        paymentStatus: input.paymentStatus,
        discountAmount: totals.discount,
        deliveryCharge: totals.delivery,
        courierDeduction: totals.courier,
        amountReceived: totals.received,
        customerPayable: totals.customerPayable,
        productCost: totals.productCost,
        netProfit: totals.netProfit,
        notes: optionalText(input.notes),
        createdById: user.id,
        updatedById: user.id,
        items: {
          create: selectedItems.map((item) => {
            const quantity = getDeliverableQuantity(item);
            const totalSellingPrice = item.unitSellingPrice.mul(quantity);
            const totalCost = item.unitCost.mul(quantity);
            return {
              orderItemId: item.id,
              quantity,
              unitSellingPrice: item.unitSellingPrice,
              unitCost: item.unitCost,
              totalSellingPrice,
              totalCost,
              profit: totalSellingPrice.sub(totalCost),
            };
          }),
        },
      },
      include: deliveryInclude,
    });

    for (const item of selectedItems) {
      await tx.orderItem.update({
        where: { id: item.id },
        data: { fulfillmentStatus: OrderItemFulfillmentStatus.IN_DELIVERY },
      });
    }

    const refreshedItems = await tx.orderItem.findMany({
      where: { orderId: order.id },
      select: { fulfillmentStatus: true },
    });
    await tx.order.update({
      where: { id: order.id },
      data: { status: getPreOrderSummaryStatus(refreshedItems), updatedById: user.id },
    });

    return deliveryToView(delivery);
  });
}

export async function completeOrderDelivery(
  id: number,
  input: CompleteOrderDeliveryInput,
  user: Actor,
) {
  return prisma.$transaction(async (tx) => {
    const delivery = await tx.orderDelivery.findUnique({ where: { id }, include: deliveryInclude });
    if (!delivery) throw new OrderServiceError("Delivery batch not found.", 404);
    if (
      delivery.status === OrderDeliveryStatus.DELIVERED ||
      delivery.status === OrderDeliveryStatus.CANCELLED ||
      delivery.status === OrderDeliveryStatus.RETURNED
    ) {
      throw new OrderServiceError("This delivery batch is already final.");
    }

    const deliveredAt = input.status === OrderDeliveryStatus.DELIVERED ? new Date() : null;
    if (input.status === OrderDeliveryStatus.DELIVERED) {
      for (const deliveryItem of delivery.items) {
        const orderItem = deliveryItem.orderItem;
        if (orderItem.productVariant.currentStock < deliveryItem.quantity) {
          throw new OrderServiceError("Cannot complete delivery because stock is no longer available.");
        }
        await tx.productVariant.update({
          where: { id: orderItem.productVariantId },
          data: { currentStock: { decrement: deliveryItem.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productVariantId: orderItem.productVariantId,
            orderId: delivery.orderId,
            orderItemId: orderItem.id,
            type: StockMovementType.SALE,
            direction: StockMovementDirection.OUT,
            quantity: deliveryItem.quantity,
            unitCost: deliveryItem.unitCost,
            totalCost: deliveryItem.totalCost,
            note: "Delivered " + delivery.deliveryNumber + " from " + delivery.order.orderNumber,
            createdById: user.id,
          },
        });
        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            fulfillmentStatus: OrderItemFulfillmentStatus.DELIVERED,
            deliveredQuantity: orderItem.deliveredQuantity + deliveryItem.quantity,
            deliveredAt,
          },
        });
        if (orderItem.purchaseItemId) {
          await tx.purchaseItem.update({
            where: { id: orderItem.purchaseItemId },
            data: { reservedPreOrderQuantity: { decrement: deliveryItem.quantity } },
          });
        }
      }
    } else {
      for (const deliveryItem of delivery.items) {
        await tx.orderItem.update({
          where: { id: deliveryItem.orderItemId },
          data: {
            fulfillmentStatus: input.status === OrderDeliveryStatus.RETURNED
              ? OrderItemFulfillmentStatus.RETURNED
              : OrderItemFulfillmentStatus.READY,
          },
        });
      }
    }

    const updatedDelivery = await tx.orderDelivery.update({
      where: { id },
      data: {
        status: input.status,
        paymentStatus: input.paymentStatus,
        amountReceived: new Prisma.Decimal(input.amountReceived ?? Number(delivery.amountReceived)),
        notes: optionalText(input.notes) ?? delivery.notes,
        deliveredAt,
        updatedById: user.id,
      },
      include: deliveryInclude,
    });

    const refreshedItems = await tx.orderItem.findMany({
      where: { orderId: delivery.orderId },
      select: { fulfillmentStatus: true },
    });
    const summaryStatus = getPreOrderSummaryStatus(refreshedItems);
    await tx.order.update({
      where: { id: delivery.orderId },
      data: {
        status: summaryStatus,
        deliveredAt: summaryStatus === OrderStatus.DELIVERED ? deliveredAt : null,
        updatedById: user.id,
      },
    });

    return deliveryToView(updatedDelivery);
  });
}

export async function fulfillPreOrder(
  id: number,
  input: FulfillPreOrderInput,
  user: Actor,
) {
  const orderItemIds =
    input.orderItemIds ??
    (
      await prisma.orderItem.findMany({
        where: {
          orderId: id,
          fulfillmentStatus: {
            notIn: [
              OrderItemFulfillmentStatus.DELIVERED,
              OrderItemFulfillmentStatus.CANCELLED,
              OrderItemFulfillmentStatus.RETURNED,
            ],
          },
        },
        select: { id: true },
      })
    ).map((item) => item.id);

  return deliverPreOrderItems(
    id,
    {
      ...input,
      orderItemIds,
    },
    user,
  );
}
