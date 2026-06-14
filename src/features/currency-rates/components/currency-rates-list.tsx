import { TableSkeleton } from "@/components/common/table-skeleton";
import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { CurrencyRateEmptyState } from "./currency-rate-empty-state";
import { CurrencyRatesTable } from "./currency-rates-table";
import { CurrencyRateMobileCardList } from "./currency-rate-mobile-card-list";
import { type CurrencyRateView } from "../types/currency-rate";

export function CurrencyRatesList({
  isLoading,
  currencyRates,
  onEdit,
  onToggleStatus,
}: {
  isLoading: boolean;
  currencyRates: CurrencyRateView[];
  onEdit: (currencyRate: CurrencyRateView) => void;
  onToggleStatus: (currencyRate: CurrencyRateView) => void;
}) {
  if (isLoading) {
    return (
      <>
        <TableSkeleton columns={5} rows={6} />
        <CardListSkeleton cards={4} />
      </>
    );
  }

  if (currencyRates.length === 0) {
    return <CurrencyRateEmptyState />;
  }

  return (
    <>
      <CurrencyRatesTable
        currencyRates={currencyRates}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
      />
      <CurrencyRateMobileCardList
        currencyRates={currencyRates}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
      />
    </>
  );
}
