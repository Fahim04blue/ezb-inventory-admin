import { z } from "zod";

const optionalMoney = z.union([z.string(), z.number()]).optional().transform((value) =>
  value === undefined || value === "" ? undefined : String(value),
);

const optionalWeight = z.union([z.string(), z.number()]).optional().transform((value) =>
  value === undefined || value === "" ? undefined : String(value),
);

const optionalRelationId = z
  .union([z.coerce.number().int().positive(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value === "" || value === null ? null : value;
  });

export const productVariantSchema = z.object({
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1).max(100).optional().or(z.literal("")),
  defaultSellingPrice: optionalMoney,
  productWeight: optionalWeight,
  shippingWeight: optionalWeight,
  lowStockAlert: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1),
  brandId: optionalRelationId,
  categoryId: optionalRelationId,
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  variants: z.array(productVariantSchema).min(1),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  brandId: optionalRelationId,
  categoryId: optionalRelationId,
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateProductStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateProductVariantSchema = z.object({
  name: z.string().trim().min(1).optional(),
  sku: z.string().trim().min(1).max(100).optional().or(z.literal("")),
  defaultSellingPrice: optionalMoney,
  productWeight: optionalWeight,
  shippingWeight: optionalWeight,
  lowStockAlert: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateProductVariantStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateProductStatusInput = z.infer<typeof updateProductStatusSchema>;
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;
export type UpdateProductVariantStatusInput = z.infer<
  typeof updateProductVariantStatusSchema
>;
