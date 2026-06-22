import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatEnum } from "@/lib/formatters";
import { type CurrencyRateView } from "../types/currency-rate";

export function CurrencyRateMobileCardList({
  currencyRates,
  onEdit,
  onToggleStatus,
}: {
  currencyRates: CurrencyRateView[];
  onEdit: (currencyRate: CurrencyRateView) => void;
  onToggleStatus: (currencyRate: CurrencyRateView) => void;
}) {
  return (
    <div className="grid gap-4 md:hidden">
      {currencyRates.map((currencyRate) => (
        <Card key={currencyRate.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{currencyRate.currency}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatEnum(currencyRate.rateType)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currencyRate.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                {currencyRate.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Rate to BDT: {currencyRate.rateToBdt}</p>
              <p>Effective: {formatDate(currencyRate.effectiveDate)}</p>
              <p>Country: {currencyRate.country || "Not set"}</p>
              <p>Source: {currencyRate.source || "Not set"}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="w-auto px-4" onClick={() => onEdit(currencyRate)} variant="outline">
                Edit
              </Button>
              <Button className="w-auto px-4" onClick={() => onToggleStatus(currencyRate)} variant="outline">
                {currencyRate.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
