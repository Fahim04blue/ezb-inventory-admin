import { prisma } from "@/lib/prisma";
import {
  CurrencyRatesPageClient,
  type CurrencyRateView,
} from "@/features/currency-rates/components/currency-rates-page-client";

async function getCurrencyRates(): Promise<CurrencyRateView[]> {
  const currencyRates = await prisma.currencyRate.findMany({
    orderBy: [{ isActive: "desc" }, { effectiveDate: "desc" }],
  });

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
  }));
}

export default async function CurrencyRatesPage() {
  const initialCurrencyRates = await getCurrencyRates();

  return <CurrencyRatesPageClient initialCurrencyRates={initialCurrencyRates} />;
}
