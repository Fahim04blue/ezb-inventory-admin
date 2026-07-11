import {
  OrderDeliveryStatus,
  OrderSource,
  OrderStatus,
  OrderType,
  PaymentStatus,
} from "@/lib/domain-enums";
import { z } from "zod";

const money = z.coerce.number().min(0).default(0);
const optionalMoney = z.preprocess(
  (value) => {
    if (value === "" || value == null) {
      return undefined;
    }

    if (typeof value === "number" && Number.isNaN(value)) {
      return undefined;
    }

    return value;
  },
  z.coerce.number().min(0).optional(),
);

export const orderItemSchema = z.object({
  orderItemId: z.coerce.number().int().positive().optional(),
  source: z.enum(["INCOMING_PURCHASE", "CURRENT_STOCK"]).optional(),
  productVariantId: z.coerce.number().int().positive(),
  purchaseItemId: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().int().positive(),
  unitSellingPrice: money,
  unitCost: money.optional(),
});

export const createOrderSchema = z
  .object({
    orderType: z.nativeEnum(OrderType).default(OrderType.NORMAL),
    status: z.nativeEnum(OrderStatus).optional(),
    orderDate: z.coerce.date().default(() => new Date()),
    source: z.nativeEnum(OrderSource).default(OrderSource.OTHER),
    paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
    customerName: z.string().trim().max(200).optional().or(z.literal("")),
    customerPhone: z.string().trim().max(100).optional().or(z.literal("")),
    customerAddress: z.string().trim().max(500).optional().or(z.literal("")),
    paidAmount: optionalMoney,
    amountReceived: optionalMoney,
    discountAmount: money,
    deliveryCharge: money,
    courierDeduction: money,
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    items: z.array(orderItemSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const subtotal = value.items.reduce(
      (sum, item) => sum + item.quantity * item.unitSellingPrice,
      0,
    );
    const customerPayable = subtotal - value.discountAmount;

    if (customerPayable < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountAmount"],
        message: "Discount cannot be greater than product subtotal.",
      });
    }

    if (
      value.orderType !== OrderType.PRE_ORDER &&
      value.courierDeduction > customerPayable + value.deliveryCharge
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["courierDeduction"],
        message: "COD/courier fee cannot exceed customer payable plus delivery charge.",
      });
    }

    if (value.orderType === OrderType.PRE_ORDER) {
      value.items.forEach((item, index) => {
        const source =
          item.source ??
          (item.purchaseItemId ? "INCOMING_PURCHASE" : "CURRENT_STOCK");

        if (source === "INCOMING_PURCHASE" && !item.purchaseItemId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", index, "purchaseItemId"],
            message: `Select an incoming purchase batch for item ${index + 1}.`,
          });
        }
      });
    }
  });

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const updateOrderSchema = createOrderSchema;

export const fulfillPreOrderSchema = z.object({
  orderItemIds: z.array(z.coerce.number().int().positive()).min(1).optional(),
  customerName: z.string().trim().max(200).optional().or(z.literal("")),
  customerPhone: z.string().trim().max(100).optional().or(z.literal("")),
  customerAddress: z.string().trim().max(500).optional().or(z.literal("")),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  discountAmount: money,
  deliveryCharge: money,
  courierDeduction: money,
  amountReceived: optionalMoney,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  finalStatus: z.union([
    z.literal(OrderStatus.READY_TO_DELIVER),
    z.literal(OrderStatus.DELIVERED),
  ]).optional(),
});

export const createOrderFromPreOrderItemsSchema = z.object({
  orderItemIds: z.array(z.coerce.number().int().positive()).min(1),
  customerName: z.string().trim().max(200).optional().or(z.literal("")),
  customerPhone: z.string().trim().max(100).optional().or(z.literal("")),
  customerAddress: z.string().trim().max(500).optional().or(z.literal("")),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  discountAmount: money,
  deliveryCharge: money,
  courierDeduction: money,
  amountReceived: optionalMoney,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const createPreOrderDeliverySchema = createOrderFromPreOrderItemsSchema;

export const updateSheinOrderCostingSchema = z.object({
  deliveryCharge: money,
  weightCharge: money,
  actualWeightCharge: money,
  totalWeightGram: z.coerce.number().int().min(0).default(0),
  courierFee: money,
  discount: money,
  amountReceived: money,
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CreateOrderInput = z.output<typeof createOrderSchema>;
export type UpdateOrderInput = z.output<typeof updateOrderSchema>;
export type UpdateOrderStatusInput = z.output<typeof updateOrderStatusSchema>;
export type FulfillPreOrderInput = z.output<typeof fulfillPreOrderSchema>;
export type UpdateSheinOrderCostingInput = z.output<typeof updateSheinOrderCostingSchema>;
export const completeOrderDeliverySchema = z.object({
  status: z.union([
    z.literal(OrderDeliveryStatus.DELIVERED),
    z.literal(OrderDeliveryStatus.CANCELLED),
    z.literal(OrderDeliveryStatus.RETURNED),
  ]),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  amountReceived: optionalMoney,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type DeliverPreOrderItemsInput = z.output<typeof createOrderFromPreOrderItemsSchema>;
export type CreateOrderFromPreOrderItemsInput = z.output<typeof createOrderFromPreOrderItemsSchema>;
export type CreatePreOrderDeliveryInput = z.output<typeof createOrderFromPreOrderItemsSchema>;
export type CompleteOrderDeliveryInput = z.output<typeof completeOrderDeliverySchema>;
