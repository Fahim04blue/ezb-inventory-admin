import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  CreateRateTypeInput,
  UpdateRateTypeInput,
  UpdateRateTypeStatusInput,
} from "@/features/rate-types/schemas/rate-type-schemas";

type Actor = {
  id: number;
};

const rateTypeSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class RateTypeServiceError extends Error {
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

function toDatabasePayload(input: {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}) {
  return {
    name: input.name?.trim(),
    code: input.code?.trim(),
    description:
      input.description !== undefined ? normalizeOptional(input.description) : undefined,
    isActive: input.isActive,
  };
}

function mapPrismaError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : "";

    if (target.includes("code")) {
      throw new RateTypeServiceError("Rate type code already exists.", 409);
    }

    throw new RateTypeServiceError("A rate type with this value already exists.", 409);
  }

  throw error;
}

export async function listRateTypes() {
  return prisma.rateType.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: rateTypeSelect,
  });
}

export async function getRateTypeById(id: number) {
  const rateType = await prisma.rateType.findUnique({
    where: { id },
    select: rateTypeSelect,
  });

  if (!rateType) {
    throw new RateTypeServiceError("Rate type not found.", 404);
  }

  return rateType;
}

export async function createRateType(input: CreateRateTypeInput, user: Actor) {
  void user;

  try {
    return await prisma.rateType.create({
      data: {
        name: input.name.trim(),
        code: input.code.trim(),
        description: normalizeOptional(input.description),
        isActive: input.isActive,
      },
      select: rateTypeSelect,
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function updateRateType(
  id: number,
  input: UpdateRateTypeInput,
  user: Actor,
) {
  void user;
  await getRateTypeById(id);

  try {
    return await prisma.rateType.update({
      where: { id },
      data: toDatabasePayload(input),
      select: rateTypeSelect,
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function updateRateTypeStatus(
  id: number,
  input: UpdateRateTypeStatusInput,
  user: Actor,
) {
  return updateRateType(id, { isActive: input.isActive }, user);
}
