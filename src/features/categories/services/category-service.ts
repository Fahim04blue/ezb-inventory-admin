import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  UpdateCategoryStatusInput,
} from "@/features/categories/schemas/category-schemas";

type Actor = {
  id: number;
};

const categorySelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class CategoryServiceError extends Error {
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

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: categorySelect,
  });
}

export async function getCategoryById(id: number) {
  const category = await prisma.category.findUnique({
    where: { id },
    select: categorySelect,
  });

  if (!category) {
    throw new CategoryServiceError("Category not found.", 404);
  }

  return category;
}

export async function createCategory(input: CreateCategoryInput, user: Actor) {
  void user;

  try {
    return await prisma.category.create({
      data: {
        name: input.name.trim(),
        description: normalizeOptional(input.description),
        isActive: input.isActive,
      },
      select: categorySelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CategoryServiceError("Category name already exists.", 409);
    }

    throw error;
  }
}

export async function updateCategory(
  id: number,
  input: UpdateCategoryInput,
  user: Actor,
) {
  void user;
  await getCategoryById(id);

  try {
    return await prisma.category.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        description:
          input.description !== undefined ? normalizeOptional(input.description) : undefined,
        isActive: input.isActive,
      },
      select: categorySelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CategoryServiceError("Category name already exists.", 409);
    }

    throw error;
  }
}

export async function updateCategoryStatus(
  id: number,
  input: UpdateCategoryStatusInput,
  user: Actor,
) {
  return updateCategory(id, { isActive: input.isActive } as UpdateCategoryInput, user);
}
