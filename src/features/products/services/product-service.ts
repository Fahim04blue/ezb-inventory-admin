import "server-only";

import { Prisma, ProductUnit } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugs";
import type {
  CreateProductInput,
  UpdateProductInput,
  UpdateProductStatusInput,
  UpdateProductVariantInput,
  UpdateProductVariantStatusInput,
  CreateProductVariantInput,
  UpdateProductVariantPriorityInput,
} from "@/features/products/schemas/product-schemas";

type Actor = {
  id: number;
};

const productSelect = {
  id: true,
  name: true,
  brandId: true,
  categoryId: true,
  brand: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  variants: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      name: true,
      sku: true,
      currentStock: true,
      lowStockAlert: true,
      defaultSellingPrice: true,
      productSizeValue: true,
      productSizeUnit: true,
      shippingWeightKg: true,
      isActive: true,
      isPriority: true,
      priorityNote: true,
      priorityRank: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

export class ProductServiceError extends Error {
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

async function buildProductSlug(name: string, id?: number) {
  const base = slugify(name);
  const suffix = id ? `-${id}` : "";
  return `${base}${suffix}`;
}

function toDecimal(value?: string) {
  return value ? new Prisma.Decimal(value) : null;
}

function toProductUnit(value?: string) {
  return value && value in ProductUnit ? (value as ProductUnit) : null;
}

async function validateBrandId(
  tx: Prisma.TransactionClient,
  brandId: number | null | undefined,
  currentBrandId?: number | null,
) {
  if (brandId === undefined) {
    return undefined;
  }

  if (brandId === null) {
    return null;
  }

  const brand = await tx.brand.findUnique({
    where: { id: brandId },
    select: { id: true, isActive: true },
  });

  if (!brand) {
    throw new ProductServiceError("Selected brand not found.", 404);
  }

  if (!brand.isActive && brand.id !== currentBrandId) {
    throw new ProductServiceError("Selected brand is inactive.", 400);
  }

  return brand.id;
}

async function validateCategoryId(
  tx: Prisma.TransactionClient,
  categoryId: number | null | undefined,
  currentCategoryId?: number | null,
) {
  if (categoryId === undefined) {
    return undefined;
  }

  if (categoryId === null) {
    return null;
  }

  const category = await tx.category.findUnique({
    where: { id: categoryId },
    select: { id: true, isActive: true },
  });

  if (!category) {
    throw new ProductServiceError("Selected category not found.", 404);
  }

  if (!category.isActive && category.id !== currentCategoryId) {
    throw new ProductServiceError("Selected category is inactive.", 400);
  }

  return category.id;
}

export async function listProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: productSelect,
  });
}

export async function getProductById(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: productSelect,
  });

  if (!product) {
    throw new ProductServiceError("Product not found.", 404);
  }

  return product;
}

export async function createProduct(input: CreateProductInput, user: Actor) {
  try {
    return await prisma.$transaction(async (tx) => {
      const brandId = await validateBrandId(tx, input.brandId);
      const categoryId = await validateCategoryId(tx, input.categoryId);

      const product = await tx.product.create({
        data: {
          name: input.name.trim(),
          brandId,
          categoryId,
          description: normalizeOptional(input.description),
          isActive: input.isActive,
          slug: await buildProductSlug(input.name),
          createdById: user.id,
          updatedById: user.id,
          variants: {
            create: input.variants.map((variant) => ({
              name: variant.name.trim(),
              sku: normalizeOptional(variant.sku),
              defaultSellingPrice: toDecimal(variant.defaultSellingPrice),
              productSizeValue: toDecimal(variant.productSizeValue),
              productSizeUnit: toProductUnit(variant.productSizeUnit),
              shippingWeightKg: toDecimal(variant.shippingWeightKg),
              lowStockAlert: variant.lowStockAlert ?? null,
              isActive: variant.isActive,
              currentStock: 0,
              createdById: user.id,
              updatedById: user.id,
            })),
          },
        },
        select: { id: true },
      });

      await tx.product.update({
        where: { id: product.id },
        data: { slug: await buildProductSlug(input.name, product.id) },
      });

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        select: productSelect,
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ProductServiceError("Product or variant SKU already exists.", 409);
    }

    throw error;
  }
}

export async function updateProduct(
  id: number,
  input: UpdateProductInput,
  user: Actor,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingProduct = await tx.product.findUnique({
        where: { id },
        select: { id: true, brandId: true, categoryId: true },
      });

      if (!existingProduct) {
        throw new ProductServiceError("Product not found.", 404);
      }

      const brandId = await validateBrandId(tx, input.brandId, existingProduct.brandId);
      const categoryId = await validateCategoryId(
        tx,
        input.categoryId,
        existingProduct.categoryId,
      );
      const nextName = input.name?.trim();

      return tx.product.update({
        where: { id },
        data: {
          name: nextName,
          brandId,
          categoryId,
          description:
            input.description !== undefined
              ? normalizeOptional(input.description)
              : undefined,
          isActive: input.isActive,
          slug: nextName ? await buildProductSlug(nextName, id) : undefined,
          updatedById: user.id,
        },
        select: productSelect,
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ProductServiceError("Product or variant SKU already exists.", 409);
    }

    throw error;
  }
}

export async function updateProductStatus(
  id: number,
  input: UpdateProductStatusInput,
  user: Actor,
) {
  return updateProduct(id, { isActive: input.isActive } as UpdateProductInput, user);
}

export async function updateProductVariant(
  id: number,
  input: UpdateProductVariantInput,
  user: Actor,
) {
  const existingVariant = await prisma.productVariant.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingVariant) {
    throw new ProductServiceError("Product variant not found.", 404);
  }

  try {
    return prisma.productVariant.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        sku: input.sku !== undefined ? normalizeOptional(input.sku) : undefined,
        defaultSellingPrice:
          input.defaultSellingPrice !== undefined
            ? toDecimal(input.defaultSellingPrice)
            : undefined,
        productSizeValue:
          input.productSizeValue !== undefined ? toDecimal(input.productSizeValue) : undefined,
        productSizeUnit:
          input.productSizeUnit !== undefined
            ? toProductUnit(input.productSizeUnit)
            : undefined,
        shippingWeightKg:
          input.shippingWeightKg !== undefined
            ? toDecimal(input.shippingWeightKg)
            : undefined,
        lowStockAlert: input.lowStockAlert,
        isActive: input.isActive,
        updatedById: user.id,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        lowStockAlert: true,
        defaultSellingPrice: true,
        productSizeValue: true,
        productSizeUnit: true,
        shippingWeightKg: true,
        isActive: true,
        isPriority: true,
        priorityNote: true,
        priorityRank: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ProductServiceError("Variant SKU already exists.", 409);
    }

    throw error;
  }
}

export async function updateProductVariantStatus(
  id: number,
  input: UpdateProductVariantStatusInput,
  user: Actor,
) {
  return updateProductVariant(
    id,
    { isActive: input.isActive } as UpdateProductVariantInput,
    user,
  );
}

export async function updateProductVariantPriority(
  id: number,
  input: UpdateProductVariantPriorityInput,
  user: Actor,
) {
  const existingVariant = await prisma.productVariant.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingVariant) {
    throw new ProductServiceError("Product variant not found.", 404);
  }

  return prisma.productVariant.update({
    where: { id },
    data: {
      isPriority: input.isPriority,
      priorityNote:
        input.priorityNote !== undefined
          ? normalizeOptional(input.priorityNote ?? undefined)
          : undefined,
      priorityRank: input.priorityRank ?? null,
      updatedById: user.id,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      currentStock: true,
      lowStockAlert: true,
      currentLandedCost: true,
      isPriority: true,
      priorityNote: true,
      priorityRank: true,
      updatedAt: true,
    },
  });
}

export async function addProductVariant(
  productId: number,
  input: CreateProductVariantInput,
  user: Actor,
) {
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!existingProduct) {
    throw new ProductServiceError("Product not found.", 404);
  }

  try {
    return await prisma.productVariant.create({
      data: {
        productId,
        name: input.name.trim(),
        sku: normalizeOptional(input.sku),
        defaultSellingPrice: toDecimal(input.defaultSellingPrice),
        productSizeValue: toDecimal(input.productSizeValue),
        productSizeUnit: toProductUnit(input.productSizeUnit),
        shippingWeightKg: toDecimal(input.shippingWeightKg),
        lowStockAlert: input.lowStockAlert ?? null,
        isActive: input.isActive,
        currentStock: 0,
        createdById: user.id,
        updatedById: user.id,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        lowStockAlert: true,
        defaultSellingPrice: true,
        productSizeValue: true,
        productSizeUnit: true,
        shippingWeightKg: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ProductServiceError("Variant SKU already exists.", 409);
    }

    throw error;
  }
}
