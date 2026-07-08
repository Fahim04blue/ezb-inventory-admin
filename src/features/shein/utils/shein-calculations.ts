import { Prisma } from "@prisma/client";

export type SheinCalculationInput = {
  quantity?: number;
  customerQuotedPriceBdt: Prisma.Decimal.Value;
  advanceReceivedBdt?: Prisma.Decimal.Value | null;
  actualSheinPriceRm?: Prisma.Decimal.Value | null;
  bankRateSnapshot?: Prisma.Decimal.Value | null;
  actualWeightGram?: number | null;
  customerWeightRateSnapshot?: Prisma.Decimal.Value | null;
  actualCargoRateSnapshot?: Prisma.Decimal.Value | null;
};

function decimal(value: Prisma.Decimal.Value | null | undefined, fallback = 0) {
  if (value === "" || value == null) {
    return new Prisma.Decimal(fallback);
  }

  return new Prisma.Decimal(value);
}

export function calculateSheinItem(input: SheinCalculationInput) {
  const quantity = input.quantity ?? 1;
  const quoted = decimal(input.customerQuotedPriceBdt).mul(quantity);
  const advance = decimal(input.advanceReceivedBdt);
  const weightGram = input.actualWeightGram ?? null;
  const customerWeightRate = decimal(input.customerWeightRateSnapshot, 1.25);
  const cargoRate = decimal(input.actualCargoRateSnapshot, 0.98);
  const actualSheinPriceRm =
    input.actualSheinPriceRm == null ? null : decimal(input.actualSheinPriceRm);
  const bankRate =
    input.bankRateSnapshot == null ? null : decimal(input.bankRateSnapshot);

  const actualItemCostBdt =
    actualSheinPriceRm && bankRate ? actualSheinPriceRm.mul(bankRate).mul(quantity) : null;
  const customerWeightChargeBdt =
    weightGram == null ? null : customerWeightRate.mul(weightGram);
  const actualCargoCostBdt =
    weightGram == null ? null : cargoRate.mul(weightGram);
  const totalCustomerPayableBdt = quoted.add(customerWeightChargeBdt ?? 0);
  const totalActualCostBdt =
    actualItemCostBdt
      ? actualItemCostBdt.add(actualCargoCostBdt ?? 0)
      : null;
  const profitBdt =
    totalActualCostBdt
      ? totalCustomerPayableBdt.sub(totalActualCostBdt)
      : null;
  const remainingDueBdt = totalCustomerPayableBdt.sub(advance);

  return {
    actualItemCostBdt,
    customerWeightChargeBdt,
    actualCargoCostBdt,
    totalCustomerPayableBdt,
    totalActualCostBdt,
    profitBdt,
    remainingDueBdt,
  };
}

export function toMoneyString(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : value.toFixed(4);
}
