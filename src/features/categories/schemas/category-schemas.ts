import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateCategoryStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpdateCategoryStatusInput = z.infer<typeof updateCategoryStatusSchema>;
