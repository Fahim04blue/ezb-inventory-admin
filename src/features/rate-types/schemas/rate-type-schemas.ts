import { z } from "zod";

const rateTypeCodeSchema = z
  .string()
  .trim()
  .min(1, "Code is required.")
  .max(120, "Code must be 120 characters or fewer.")
  .regex(
    /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/,
    "Code must be uppercase snake case, for example CUSTOMER_SELLING.",
  );

export const createRateTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  code: rateTypeCodeSchema,
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateRateTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120).optional(),
  code: rateTypeCodeSchema.optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateRateTypeStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateRateTypeFormInput = z.input<typeof createRateTypeSchema>;
export type CreateRateTypeInput = z.output<typeof createRateTypeSchema>;
export type UpdateRateTypeInput = z.output<typeof updateRateTypeSchema>;
export type UpdateRateTypeStatusInput = z.output<typeof updateRateTypeStatusSchema>;
