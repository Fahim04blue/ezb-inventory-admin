import { RateManagementPageClient } from "@/features/currency-rates/components/rate-management-page-client";
import { listCurrencyRates } from "@/features/currency-rates/services/currency-rate-service";
import { type CurrencyRateView } from "@/features/currency-rates/types/currency-rate";
import { listRateTypes } from "@/features/rate-types/services/rate-type-service";
import type { RateTypeView } from "@/features/rate-types/types/rate-type";

async function getCurrencyRates(): Promise<CurrencyRateView[]> {
  const currencyRates = await listCurrencyRates();

  return currencyRates.map((currencyRate) => ({
    id: currencyRate.id,
    currency: currencyRate.currency,
    rateType: currencyRate.rateType,
    rateToBdt: currencyRate.rateToBdt.toString(),
    effectiveDate: currencyRate.effectiveDate.toISOString(),
    country: currencyRate.country,
    source: currencyRate.source,
    note: currencyRate.note,
    isActive: currencyRate.isActive,
    createdAt: currencyRate.createdAt.toISOString(),
    updatedAt: currencyRate.updatedAt.toISOString(),
  }));
}

async function getRateTypes(): Promise<RateTypeView[]> {
  return listRateTypes();
}

export default async function CurrencyRatesPage() {
  const [initialCurrencyRates, initialRateTypes] = await Promise.all([
    getCurrencyRates(),
    getRateTypes(),
  ]);

  return (
    <RateManagementPageClient
      initialRates={initialCurrencyRates}
      initialRateTypes={initialRateTypes}
    />
  );
}
