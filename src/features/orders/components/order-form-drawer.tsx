"use client";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { OrderType } from "@/lib/domain-enums";
import type { CreateOrderInput } from "../schemas/order.schema";
import type {
  OrderVariantOption,
  OrderView,
  PreOrderPurchaseItemOption,
} from "../types/order.types";
import { OrderForm } from "./order-form";

type OrderFormDrawerProps = {
  open: boolean;
  variantOptions: OrderVariantOption[];
  preOrderPurchaseItems: PreOrderPurchaseItemOption[];
  isSubmitting: boolean;
  order?: OrderView | null;
  initialOrderType?: OrderType | null;
  initialPurchaseItemId?: number | null;
  onClose: () => void;
  onSubmit: (input: CreateOrderInput) => Promise<void>;
};

export function OrderFormDrawer({
  open,
  variantOptions,
  preOrderPurchaseItems,
  isSubmitting,
  order,
  initialOrderType,
  initialPurchaseItemId,
  onClose,
  onSubmit,
}: OrderFormDrawerProps) {
  return (
    <CrudDrawer
      description={
        order
          ? "Edit order details and items. Inventory changes are reconciled automatically."
          : "Create a normal order from stock or reserve an incoming purchase item as a pre-order."
      }
      onClose={onClose}
      open={open}
      title={order ? `Edit ${order.orderNumber}` : "Add Order"}
    >
      <OrderForm
        key={
          order?.id ??
          `create-order-${initialOrderType ?? "default"}-${initialPurchaseItemId ?? "blank"}`
        }
        initialOrderType={initialOrderType}
        initialPurchaseItemId={initialPurchaseItemId}
        isSubmitting={isSubmitting}
        order={order}
        onCancel={onClose}
        onSubmit={onSubmit}
        preOrderPurchaseItems={preOrderPurchaseItems}
        variantOptions={variantOptions}
      />
    </CrudDrawer>
  );
}
