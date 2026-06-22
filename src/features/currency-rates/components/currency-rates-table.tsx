import { Edit, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatEnum } from "@/lib/formatters";
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
    <div className="hidden w-full min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
      <div className="w-full min-w-0 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)] gap-4 border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
            <div>Currency</div>
            <div>Rate Type</div>
            <div>Rate to BDT</div>
            <div>Effective / Country</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-border">
            {currencyRates.map((currencyRate) => (
              <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)] items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors" key={currencyRate.id}>
                <div>
                  <p className="font-semibold">{currencyRate.currency}</p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${currencyRate.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                    {currencyRate.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{formatEnum(currencyRate.rateType)}</div>
                <div className="text-sm text-foreground font-medium">{currencyRate.rateToBdt}</div>
                <div className="text-sm text-muted-foreground">
                  <p>{formatDate(currencyRate.effectiveDate)}</p>
                  <p className="mt-0.5">{currencyRate.country || "No country"}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="h-8 px-3 text-xs" onClick={() => onEdit(currencyRate)} variant="outline">
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button className="h-8 px-3 text-xs" onClick={() => onToggleStatus(currencyRate)} variant="outline">
                    <Power className="mr-2 h-3 w-3" />
                    {currencyRate.isActive ? "Deact." : "Act."}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
