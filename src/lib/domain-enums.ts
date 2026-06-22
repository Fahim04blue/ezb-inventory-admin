function enumValues<const T extends Record<string, string>>(values: T) {
  return values;
}

export const UserRole = enumValues({ OWNER: "OWNER", ADMIN: "ADMIN" });
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Currency = enumValues({
  BDT: "BDT",
  MYR: "MYR",
  THB: "THB",
  CNY: "CNY",
  USD: "USD",
});
export type Currency = (typeof Currency)[keyof typeof Currency];

export const CurrencyRateType = enumValues({
  CARD_PURCHASE: "CARD_PURCHASE",
  CARGO_PAYMENT: "CARGO_PAYMENT",
  MANUAL: "MANUAL",
  OTHER: "OTHER",
});
export type CurrencyRateType =
  (typeof CurrencyRateType)[keyof typeof CurrencyRateType];

export const PurchaseStatus = enumValues({
  ORDERED: "ORDERED",
  IN_CARGO: "IN_CARGO",
  RECEIVED: "RECEIVED",
  PARTIALLY_RECEIVED: "PARTIALLY_RECEIVED",
  CANCELLED: "CANCELLED",
});
export type PurchaseStatus =
  (typeof PurchaseStatus)[keyof typeof PurchaseStatus];

export const PaymentStatus = enumValues({
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
});
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const OrderType = enumValues({ NORMAL: "NORMAL", PRE_ORDER: "PRE_ORDER" });
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const OrderStatus = enumValues({
  PENDING: "PENDING",
  PRE_ORDERED: "PRE_ORDERED",
  CONFIRMED: "CONFIRMED",
  READY_TO_DELIVER: "READY_TO_DELIVER",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURNED: "RETURNED",
});
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderSource = enumValues({
  FACEBOOK: "FACEBOOK",
  INSTAGRAM: "INSTAGRAM",
  WHATSAPP: "WHATSAPP",
  OFFLINE: "OFFLINE",
  MIXED: "MIXED",
  OTHER: "OTHER",
});
export type OrderSource = (typeof OrderSource)[keyof typeof OrderSource];

export const StockMovementType = enumValues({
  PURCHASE_RECEIVE: "PURCHASE_RECEIVE",
  SALE: "SALE",
  RETURN: "RETURN",
  DAMAGE: "DAMAGE",
  ADJUSTMENT_IN: "ADJUSTMENT_IN",
  ADJUSTMENT_OUT: "ADJUSTMENT_OUT",
  GIVEAWAY: "GIVEAWAY",
  PR_SEND: "PR_SEND",
});
export type StockMovementType =
  (typeof StockMovementType)[keyof typeof StockMovementType];

export const StockMovementDirection = enumValues({ IN: "IN", OUT: "OUT" });
export type StockMovementDirection =
  (typeof StockMovementDirection)[keyof typeof StockMovementDirection];

export const ExpenseCategory = enumValues({
  PRODUCT_PURCHASE: "PRODUCT_PURCHASE",
  CARGO_WEIGHT_CHARGE: "CARGO_WEIGHT_CHARGE",
  PACKAGING: "PACKAGING",
  COURIER: "COURIER",
  FACEBOOK_BOOST: "FACEBOOK_BOOST",
  INSTAGRAM_BOOST: "INSTAGRAM_BOOST",
  META_ADS: "META_ADS",
  GIVEAWAY: "GIVEAWAY",
  PR_PROMOTION: "PR_PROMOTION",
  DAMAGE_LOSS: "DAMAGE_LOSS",
  TRANSPORT: "TRANSPORT",
  PAYMENT_CHARGE: "PAYMENT_CHARGE",
  REFUND: "REFUND",
  TOOLS_SUBSCRIPTION: "TOOLS_SUBSCRIPTION",
  OTHER: "OTHER",
});
export type ExpenseCategory =
  (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const ProductUnit = enumValues({
  ML: "ML",
  G: "G",
  KG: "KG",
  PCS: "PCS",
  SET: "SET",
});
export type ProductUnit = (typeof ProductUnit)[keyof typeof ProductUnit];
