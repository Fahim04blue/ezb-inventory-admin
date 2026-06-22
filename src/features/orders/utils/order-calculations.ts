import { Prisma } from "@prisma/client";

function zeroIfNegative(value: Prisma.Decimal) {
  return value.isNegative() ? new Prisma.Decimal(0) : value;
}

export function calculateOrderTotals(
  items: {
    quantity: number;
    unitSellingPrice: number;
    unitCost: number;
  }[],
  discountAmount: number,
  deliveryCharge: number,
  courierDeduction: number,
  amountReceived?: number,
  paidAmount?: number,
) {
  const subtotal = items.reduce(
    (sum, item) =>
      sum.add(new Prisma.Decimal(item.unitSellingPrice).mul(item.quantity)),
    new Prisma.Decimal(0),
  );
  const productCost = items.reduce(
    (sum, item) => sum.add(new Prisma.Decimal(item.unitCost).mul(item.quantity)),
    new Prisma.Decimal(0),
  );
  const itemGrossProfit = subtotal.sub(productCost);
  const discount = new Prisma.Decimal(discountAmount);
  const delivery = new Prisma.Decimal(deliveryCharge);
  const courier = new Prisma.Decimal(courierDeduction);
  const customerPayable = subtotal.sub(discount);
  const expectedReceived = customerPayable.add(delivery).sub(courier);
  const receivedInput = amountReceived ?? paidAmount;
  const received =
    receivedInput == null
      ? expectedReceived
      : new Prisma.Decimal(receivedInput);
  const grossProfit = customerPayable.sub(productCost);
  const netProfit = received.sub(productCost);
  const rawDueAmount = expectedReceived.sub(received);
  const dueAmount = zeroIfNegative(rawDueAmount);

  return {
    subtotal,
    productCost,
    itemGrossProfit,
    discount,
    delivery,
    courier,
    received,
    customerPayable,
    totalAmount: customerPayable,
    grossProfit,
    netProfit,
    dueAmount,
  };
}

export function calculatePreOrderTotals(
  items: {
    quantity: number;
    unitSellingPrice: number;
    unitCost: number;
  }[],
  amountReceived?: number,
  paidAmount?: number,
) {
  const subtotal = items.reduce(
    (sum, item) =>
      sum.add(new Prisma.Decimal(item.unitSellingPrice).mul(item.quantity)),
    new Prisma.Decimal(0),
  );
  const productCost = items.reduce(
    (sum, item) => sum.add(new Prisma.Decimal(item.unitCost).mul(item.quantity)),
    new Prisma.Decimal(0),
  );
  const receivedInput = amountReceived ?? paidAmount;
  const received =
    receivedInput == null ? new Prisma.Decimal(0) : new Prisma.Decimal(receivedInput);
  const expectedProfit = subtotal.sub(productCost);
  const dueAmount = zeroIfNegative(subtotal.sub(received));

  return {
    subtotal,
    productCost,
    discount: new Prisma.Decimal(0),
    delivery: new Prisma.Decimal(0),
    courier: new Prisma.Decimal(0),
    received,
    customerPayable: subtotal,
    totalAmount: subtotal,
    grossProfit: expectedProfit,
    netProfit: expectedProfit,
    dueAmount,
  };
}
