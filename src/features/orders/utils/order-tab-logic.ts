import {
  OrderItemFulfillmentStatus,
  OrderStatus,
  OrderType,
} from "@/lib/domain-enums";
import type {
  OrderItemView,
  OrderView,
  PreOrderQuickFilter,
} from "../types/order.types";

export type PreOrderItemState = "WAITING" | "READY" | "MOVED_TO_ORDER";

const COMPLETED_STATUSES = new Set<OrderStatus>([
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.RETURNED,
]);

export function isCompletedOrder(order: OrderView) {
  return COMPLETED_STATUSES.has(order.status);
}

export function isActivePreOrder(order: OrderView) {
  return order.orderType === OrderType.PRE_ORDER && !isCompletedOrder(order);
}

export function getPreOrderItemState(item: OrderItemView): PreOrderItemState {
  if (item.fulfillmentStatus === OrderItemFulfillmentStatus.MOVED_TO_ORDER) {
    return "MOVED_TO_ORDER";
  }

  if (
    item.fulfillmentStatus === OrderItemFulfillmentStatus.DELIVERED ||
    item.fulfillmentStatus === OrderItemFulfillmentStatus.IN_DELIVERY ||
    item.fulfillmentStatus === OrderItemFulfillmentStatus.CANCELLED ||
    item.fulfillmentStatus === OrderItemFulfillmentStatus.RETURNED
  ) {
    return "MOVED_TO_ORDER";
  }

  const remainingQuantity = Math.max(0, item.quantity - item.deliveredQuantity);

  if (
    item.fulfillmentStatus === OrderItemFulfillmentStatus.READY ||
    item.currentStock >= remainingQuantity
  ) {
    return "READY";
  }

  return "WAITING";
}

export function getPreOrderItemStateCounts(order: OrderView) {
  return order.items.reduce(
    (counts, item) => {
      counts[getPreOrderItemState(item)] += 1;
      return counts;
    },
    { WAITING: 0, READY: 0, MOVED_TO_ORDER: 0 } satisfies Record<
      PreOrderItemState,
      number
    >,
  );
}

export function hasReadyPreOrderWork(order: OrderView) {
  if (!isActivePreOrder(order)) {
    return false;
  }

  const counts = getPreOrderItemStateCounts(order);
  return counts.READY > 0;
}

export function shouldShowInActiveOrders(order: OrderView) {
  if (isCompletedOrder(order)) {
    return false;
  }

  return order.orderType === OrderType.NORMAL;
}

export function shouldShowInPreOrders(order: OrderView) {
  const counts = getPreOrderItemStateCounts(order);
  return isActivePreOrder(order) && (counts.WAITING > 0 || counts.READY > 0);
}

function isLegacyCompletedPreOrderSale(order: OrderView) {
  return (
    order.orderType === OrderType.PRE_ORDER &&
    order.status === OrderStatus.DELIVERED &&
    order.preOrderMovedItemCount === 0
  );
}

export function shouldShowInCompleted(order: OrderView) {
  return (
    (order.orderType === OrderType.NORMAL && isCompletedOrder(order)) ||
    isLegacyCompletedPreOrderSale(order)
  );
}

export function getPreOrderReadiness(
  order: OrderView,
): Exclude<PreOrderQuickFilter, "ALL" | "PAYMENT_DUE"> {
  const counts = getPreOrderItemStateCounts(order);

  const activeCount = counts.WAITING + counts.READY;

  if (activeCount > 0 && counts.READY === activeCount) {
    return "READY";
  }

  if (counts.READY > 0) {
    return "PARTIAL";
  }

  return "WAITING";
}

export function getPreOrderActionLabel(order: OrderView) {
  const counts = getPreOrderItemStateCounts(order);
  if (counts.READY > 0) return "Create Order";
  if (counts.WAITING > 0) return "Waiting for Remaining Items";
  return "Items Moved";
}
