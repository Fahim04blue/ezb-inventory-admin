import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateBrandStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateBrandFormInput = z.input<typeof createBrandSchema>;
export type CreateBrandInput = z.output<typeof createBrandSchema>;
export type UpdateBrandInput = z.output<typeof updateBrandSchema>;
export type UpdateBrandStatusInput = z.output<typeof updateBrandStatusSchema>;
