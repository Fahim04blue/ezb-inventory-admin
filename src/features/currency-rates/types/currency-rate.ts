export type CurrencyRateListItem = {
  id: number;
  currency: string;
  rateType: string;
  rateToBdt: string;
  effectiveDate: Date;
  country: string | null;
  source: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
