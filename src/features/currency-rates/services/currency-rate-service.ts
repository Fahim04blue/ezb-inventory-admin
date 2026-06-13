import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  CreateCurrencyRateInput,
  UpdateCurrencyRateInput,
  UpdateCurrencyRateStatusInput,
} from "@/features/currency-rates/schemas/currency-rate-schemas";

type Actor = {
  id: number;
};

const currencyRateSelect = {
  id: true,
  currency: true,
  rateType: true,
  rateToBdt: true,
  effectiveDate: true,
  country: true,
  source: true,
  note: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class CurrencyRateServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function normalizeOptional(value?: string) {
  return value?.trim() ? value.trim() : null;
}

export async function listCurrencyRates() {
  return prisma.currencyRate.findMany({
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
    select: currencyRateSelect,
  });
}

export async function getCurrencyRateById(id: number) {
  const currencyRate = await prisma.currencyRate.findUnique({
    where: { id },
    select: currencyRateSelect,
  });

  if (!currencyRate) {
    throw new CurrencyRateServiceError("Currency rate not found.", 404);
  }

  return currencyRate;
}

export async function createCurrencyRate(
  input: CreateCurrencyRateInput,
  user: Actor,
) {
  void user;

  return prisma.currencyRate.create({
    data: {
      currency: input.currency,
      rateType: input.rateType,
      rateToBdt: new Prisma.Decimal(input.rateToBdt),
      effectiveDate: input.effectiveDate,
      country: normalizeOptional(input.country),
      source: normalizeOptional(input.source),
      note: normalizeOptional(input.note),
      isActive: input.isActive,
    },
    select: currencyRateSelect,
  });
}

export async function updateCurrencyRate(
  id: number,
  input: UpdateCurrencyRateInput,
  user: Actor,
) {
  void user;

  await getCurrencyRateById(id);

  return prisma.currencyRate.update({
    where: { id },
    data: {
      currency: input.currency,
      rateType: input.rateType,
      rateToBdt:
        input.rateToBdt !== undefined ? new Prisma.Decimal(input.rateToBdt) : undefined,
      effectiveDate: input.effectiveDate,
      country: input.country !== undefined ? normalizeOptional(input.country) : undefined,
      source: input.source !== undefined ? normalizeOptional(input.source) : undefined,
      note: input.note !== undefined ? normalizeOptional(input.note) : undefined,
      isActive: input.isActive,
    },
    select: currencyRateSelect,
  });
}

export async function updateCurrencyRateStatus(
  id: number,
  input: UpdateCurrencyRateStatusInput,
  user: Actor,
) {
  return updateCurrencyRate(
    id,
    { isActive: input.isActive } as UpdateCurrencyRateInput,
    user,
  );
}
