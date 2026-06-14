import { Currency, CurrencyRateType } from "@prisma/client";

export type CurrencyRateView = {
  id: number;
  currency: Currency;
  rateType: CurrencyRateType;
  rateToBdt: string;
  effectiveDate: string;
  country: string | null;
  source: string | null;
  note: string | null;
  isActive: boolean;
};

export type ApiSuccess<T> = {
  status: "success";
  code: number;
  message: string;
  data: T;
};

export type ApiError = {
  status: "error";
  code: number;
  message: string;
  data: unknown;
};

export type DrawerState =
  | { mode: "create" }
  | { mode: "edit"; currencyRate: CurrencyRateView }
  | null;
