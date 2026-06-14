import { Edit, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import { type CurrencyRateView } from "../types/currency-rate";

export function CurrencyRatesTable({
  currencyRates,
  onEdit,
  onToggleStatus,
}: {
  currencyRates: CurrencyRateView[];
  onEdit: (currencyRate: CurrencyRateView) => void;
  onToggleStatus: (currencyRate: CurrencyRateView) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
      <div className="grid grid-cols-[0.9fr_1.1fr_0.9fr_1fr_0.9fr] gap-4 border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground">
        <div>Currency</div>
        <div>Rate Type</div>
        <div>Rate to BDT</div>
        <div>Effective / Country</div>
        <div>Actions</div>
      </div>
      <div className="divide-y divide-border">
        {currencyRates.map((currencyRate) => (
          <div className="grid grid-cols-[0.9fr_1.1fr_0.9fr_1fr_0.9fr] gap-4 px-6 py-5" key={currencyRate.id}>
            <div>
              <p className="font-semibold">{currencyRate.currency}</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${currencyRate.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                {currencyRate.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">{currencyRate.rateType}</div>
            <div className="text-sm text-muted-foreground">{currencyRate.rateToBdt}</div>
            <div className="text-sm text-muted-foreground">
              <p>{formatDate(currencyRate.effectiveDate)}</p>
              <p className="mt-1">{currencyRate.country || "No country"}</p>
            </div>
            <div className="space-y-2">
              <Button className="w-auto px-4" onClick={() => onEdit(currencyRate)} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button className="w-auto px-4" onClick={() => onToggleStatus(currencyRate)} variant="outline">
                <Power className="mr-2 h-4 w-4" />
                {currencyRate.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
