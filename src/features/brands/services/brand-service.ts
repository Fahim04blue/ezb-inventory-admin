import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  CreateBrandInput,
  UpdateBrandInput,
  UpdateBrandStatusInput,
} from "@/features/brands/schemas/brand-schemas";

type Actor = {
  id: number;
};

const brandSelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class BrandServiceError extends Error {
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

export async function listBrands() {
  return prisma.brand.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: brandSelect,
  });
}

export async function getBrandById(id: number) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    select: brandSelect,
  });

  if (!brand) {
    throw new BrandServiceError("Brand not found.", 404);
  }

  return brand;
}

export async function createBrand(input: CreateBrandInput, user: Actor) {
  void user;

  try {
    return await prisma.brand.create({
      data: {
        name: input.name.trim(),
        description: normalizeOptional(input.description),
        isActive: input.isActive,
      },
      select: brandSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BrandServiceError("Brand name already exists.", 409);
    }

    throw error;
  }
}

export async function updateBrand(
  id: number,
  input: UpdateBrandInput,
  user: Actor,
) {
  void user;
  await getBrandById(id);

  try {
    return await prisma.brand.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        description:
          input.description !== undefined ? normalizeOptional(input.description) : undefined,
        isActive: input.isActive,
      },
      select: brandSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BrandServiceError("Brand name already exists.", 409);
    }

    throw error;
  }
}

export async function updateBrandStatus(
  id: number,
  input: UpdateBrandStatusInput,
  user: Actor,
) {
  return updateBrand(id, { isActive: input.isActive } as UpdateBrandInput, user);
}
