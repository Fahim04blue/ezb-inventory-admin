import { formatEnum } from "@/lib/formatters";
import type {
  CurrencyRateView,
  RateLifecycleStatus,
  RateManagementView,
} from "@/features/currency-rates/types/currency-rate";

type HistoryFilters = {
  search: string;
  rateType: string;
  currency: string;
  country: string;
  status: string;
  date: string;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function sortByNewest(a: CurrencyRateView, b: CurrencyRateView) {
  const effectiveDiff =
    new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();

  if (effectiveDiff !== 0) {
    return effectiveDiff;
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function getRateGroupKey(rate: CurrencyRateView) {
  return [
    rate.currency,
    normalizeText(rate.country),
    rate.rateType,
  ].join("::");
}

export function getCurrentRateIds(rates: CurrencyRateView[]) {
  const latestByGroup = new Map<string, CurrencyRateView>();

  for (const rate of [...rates].sort(sortByNewest)) {
    if (!rate.isActive) {
      continue;
    }

    const groupKey = getRateGroupKey(rate);
    if (!latestByGroup.has(groupKey)) {
      latestByGroup.set(groupKey, rate);
    }
  }

  return new Set([...latestByGroup.values()].map((rate) => rate.id));
}

export function getRateStatus(
  rate: CurrencyRateView,
  currentRateIds: Set<number>,
): RateLifecycleStatus {
  if (!rate.isActive) {
    return "DISABLED";
  }

  return currentRateIds.has(rate.id) ? "CURRENT" : "HISTORY";
}

export function toRateManagementViews(rates: CurrencyRateView[]): RateManagementView[] {
  const currentRateIds = getCurrentRateIds(rates);

  return [...rates]
    .sort(sortByNewest)
    .map((rate) => ({
      ...rate,
      rateName: rate.source?.trim() || `${formatEnum(rate.rateType)} ${rate.currency}`,
      displayType: formatEnum(rate.rateType),
      displayUnit: `${rate.currency} -> BDT`,
      displayStatus: getRateStatus(rate, currentRateIds),
      groupKey: getRateGroupKey(rate),
    }));
}

export function getActiveRates(rates: RateManagementView[]) {
  return rates.filter((rate) => rate.displayStatus === "CURRENT");
}

export function filterRateHistory(
  rates: RateManagementView[],
  filters: HistoryFilters,
) {
  return rates.filter((rate) => {
    const matchesSearch =
      !filters.search ||
      [
        rate.rateName,
        rate.displayType,
        rate.currency,
        rate.country,
        rate.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(filters.search.toLowerCase());

    const matchesType = !filters.rateType || rate.rateType === filters.rateType;
    const matchesCurrency =
      !filters.currency || rate.currency === filters.currency;
    const matchesCountry =
      !filters.country ||
      normalizeText(rate.country) === normalizeText(filters.country);
    const matchesStatus =
      !filters.status || rate.displayStatus === filters.status;
    const matchesDate =
      !filters.date ||
      rate.effectiveDate.slice(0, 10) === filters.date;

    return (
      matchesSearch &&
      matchesType &&
      matchesCurrency &&
      matchesCountry &&
      matchesStatus &&
      matchesDate
    );
  });
}
