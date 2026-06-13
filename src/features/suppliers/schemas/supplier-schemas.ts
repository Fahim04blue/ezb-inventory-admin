import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  contactInfo: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateSupplierSchema = z.object({
  name: z.string().trim().min(1).optional(),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  contactInfo: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateSupplierStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type UpdateSupplierStatusInput = z.infer<typeof updateSupplierStatusSchema>;
