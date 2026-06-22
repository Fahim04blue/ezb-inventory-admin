import { Currency, CurrencyRateType } from "@/lib/domain-enums";
import { z } from "zod";

export const createCurrencyRateSchema = z.object({
  currency: z.nativeEnum(Currency),
  rateType: z.nativeEnum(CurrencyRateType),
  rateToBdt: z.union([z.string(), z.number()]).transform((value) => String(value)),
  effectiveDate: z.coerce.date(),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  source: z.string().trim().max(100).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateCurrencyRateSchema = z.object({
  currency: z.nativeEnum(Currency).optional(),
  rateType: z.nativeEnum(CurrencyRateType).optional(),
  rateToBdt: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => (value === undefined ? undefined : String(value))),
  effectiveDate: z.coerce.date().optional(),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  source: z.string().trim().max(100).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateCurrencyRateStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateCurrencyRateInput = z.infer<typeof createCurrencyRateSchema>;
export type UpdateCurrencyRateInput = z.infer<typeof updateCurrencyRateSchema>;
export type UpdateCurrencyRateStatusInput = z.infer<
  typeof updateCurrencyRateStatusSchema
>;
