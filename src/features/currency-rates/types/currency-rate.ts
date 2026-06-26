import type { Currency, CurrencyRateType } from "@/lib/domain-enums";

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
  createdAt: string;
  updatedAt: string;
};

export type RateLifecycleStatus = "CURRENT" | "HISTORY" | "DISABLED";

export type RateManagementView = CurrencyRateView & {
  rateName: string;
  displayType: string;
  displayUnit: string;
  displayStatus: RateLifecycleStatus;
  groupKey: string;
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
  | { mode: "create"; initialCurrencyRate?: CurrencyRateView }
  | { mode: "edit"; currencyRate: CurrencyRateView }
  | null;
