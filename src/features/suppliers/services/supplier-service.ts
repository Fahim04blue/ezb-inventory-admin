import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  CreateSupplierInput,
  UpdateSupplierInput,
  UpdateSupplierStatusInput,
} from "@/features/suppliers/schemas/supplier-schemas";

type Actor = {
  id: number;
};

const supplierSelect = {
  id: true,
  name: true,
  country: true,
  contactInfo: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class SupplierServiceError extends Error {
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

export async function listSuppliers() {
  return prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
    select: supplierSelect,
  });
}

export async function getSupplierById(id: number) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: supplierSelect,
  });

  if (!supplier) {
    throw new SupplierServiceError("Supplier not found.", 404);
  }

  return supplier;
}

export async function createSupplier(input: CreateSupplierInput, user: Actor) {
  return prisma.supplier.create({
    data: {
      name: input.name.trim(),
      country: normalizeOptional(input.country),
      contactInfo: normalizeOptional(input.contactInfo),
      notes: normalizeOptional(input.notes),
      isActive: input.isActive,
      createdById: user.id,
      updatedById: user.id,
    },
    select: supplierSelect,
  });
}

export async function updateSupplier(
  id: number,
  input: UpdateSupplierInput,
  user: Actor,
) {
  await getSupplierById(id);

  return prisma.supplier.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      country: input.country !== undefined ? normalizeOptional(input.country) : undefined,
      contactInfo:
        input.contactInfo !== undefined
          ? normalizeOptional(input.contactInfo)
          : undefined,
      notes: input.notes !== undefined ? normalizeOptional(input.notes) : undefined,
      isActive: input.isActive,
      updatedById: user.id,
    },
    select: supplierSelect,
  });
}

export async function updateSupplierStatus(
  id: number,
  input: UpdateSupplierStatusInput,
  user: Actor,
) {
  return updateSupplier(id, { isActive: input.isActive } as UpdateSupplierInput, user);
}
