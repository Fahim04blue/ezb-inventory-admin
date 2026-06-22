import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { SalesSummaryInput } from "../schemas/sales-summary-schemas";
import { type SalesSummaryView } from "../types/sales-summary.types";

export class SalesSummaryServiceError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = "SalesSummaryServiceError";
  }
}

type SalesSummaryRecord = Prisma.SalesSummaryGetPayload<Record<string, never>>;

function mapToView(summary: SalesSummaryRecord): SalesSummaryView {
  const estimatedGrossProfit = summary.estimatedProductCost
    ? summary.amountBdt.sub(summary.estimatedProductCost)
    : null;

  return {
    id: summary.id,
    date: summary.date.toISOString(),
    title: summary.title,
    source: summary.source,
    amountBdt: summary.amountBdt.toString(),
    estimatedProductCost: summary.estimatedProductCost?.toString() ?? null,
    estimatedGrossProfit: estimatedGrossProfit?.toString() ?? null,
    deliveryChargeCollectedBdt: summary.deliveryChargeCollectedBdt?.toString() || null,
    notes: summary.notes,
    isActive: summary.isActive,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
  };
}

export async function getSalesSummaries(): Promise<SalesSummaryView[]> {
  const summaries = await prisma.salesSummary.findMany({
    orderBy: { date: "desc" },
  });

  return summaries.map(mapToView);
}

export async function getSalesSummaryById(id: number): Promise<SalesSummaryView | null> {
  const summary = await prisma.salesSummary.findUnique({
    where: { id },
  });

  return summary ? mapToView(summary) : null;
}

export async function createSalesSummary(
  data: SalesSummaryInput,
  user: { id: number }
): Promise<SalesSummaryView> {
  const summary = await prisma.salesSummary.create({
    data: {
      ...data,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  return mapToView(summary);
}

export async function updateSalesSummary(
  id: number,
  data: SalesSummaryInput,
  user: { id: number }
): Promise<SalesSummaryView> {
  const existing = await prisma.salesSummary.findUnique({ where: { id } });

  if (!existing) {
    throw new SalesSummaryServiceError("Sales summary not found", 404);
  }

  const summary = await prisma.salesSummary.update({
    where: { id },
    data: {
      ...data,
      updatedById: user.id,
    },
  });

  return mapToView(summary);
}

export async function updateSalesSummaryStatus(
  id: number,
  data: { isActive: boolean },
  user: { id: number }
): Promise<SalesSummaryView> {
  const existing = await prisma.salesSummary.findUnique({ where: { id } });

  if (!existing) {
    throw new SalesSummaryServiceError("Sales summary not found", 404);
  }

  const summary = await prisma.salesSummary.update({
    where: { id },
    data: {
      isActive: data.isActive,
      updatedById: user.id,
    },
  });

  return mapToView(summary);
}
