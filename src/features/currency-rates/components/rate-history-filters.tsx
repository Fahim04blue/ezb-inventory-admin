import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RateHistoryFiltersValue = {
  search: string;
  rateType: string;
  currency: string;
  country: string;
  status: string;
  date: string;
};

export function RateHistoryFilters({
  filters,
  rateTypes,
  currencies,
  countries,
  onChange,
  onClear,
}: {
  filters: RateHistoryFiltersValue;
  rateTypes: string[];
  currencies: string[];
  countries: string[];
  onChange: (next: RateHistoryFiltersValue) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="rate-search">Search</Label>
          <Input
            id="rate-search"
            placeholder="Search name, note, country"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate-type-filter">Rate Type</Label>
          <select
            className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
            id="rate-type-filter"
            value={filters.rateType}
            onChange={(event) => onChange({ ...filters, rateType: event.target.value })}
          >
            <option value="">All types</option>
            {rateTypes.map((rateType) => (
              <option key={rateType} value={rateType}>
                {rateType}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate-currency-filter">Currency/Unit</Label>
          <select
            className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
            id="rate-currency-filter"
            value={filters.currency}
            onChange={(event) => onChange({ ...filters, currency: event.target.value })}
          >
            <option value="">All currencies</option>
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate-country-filter">Country</Label>
          <select
            className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
            id="rate-country-filter"
            value={filters.country}
            onChange={(event) => onChange({ ...filters, country: event.target.value })}
          >
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate-status-filter">Status</Label>
          <select
            className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
            id="rate-status-filter"
            value={filters.status}
            onChange={(event) => onChange({ ...filters, status: event.target.value })}
          >
            <option value="">All statuses</option>
            <option value="CURRENT">Current</option>
            <option value="HISTORY">History</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate-date-filter">Date</Label>
          <Input
            id="rate-date-filter"
            type="date"
            value={filters.date}
            onChange={(event) => onChange({ ...filters, date: event.target.value })}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button className="h-9 px-4" onClick={onClear} type="button" variant="outline">
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
