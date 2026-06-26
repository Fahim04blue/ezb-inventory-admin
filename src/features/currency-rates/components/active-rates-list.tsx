import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import type { RateManagementView } from "@/features/currency-rates/types/currency-rate";
import { RateStatusBadge } from "./rate-status-badge";

export function ActiveRatesList({
  isLoading,
  rates,
  onEdit,
  onCreateNewRate,
  onToggleStatus,
}: {
  isLoading: boolean;
  rates: RateManagementView[];
  onEdit: (rate: RateManagementView) => void;
  onCreateNewRate: (rate: RateManagementView) => void;
  onToggleStatus: (rate: RateManagementView) => void;
}) {
  if (isLoading) {
    return (
      <>
        <TableSkeleton columns={8} rows={5} />
        <CardListSkeleton cards={3} />
      </>
    );
  }

  if (rates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-8 text-sm text-muted-foreground">
          No current rates yet. Add a rate to define what the business is using now.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,1fr)] gap-4 border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
              <div>Rate Name</div>
              <div>Type</div>
              <div>Currency/Unit</div>
              <div>Rate to BDT</div>
              <div>Country</div>
              <div>Effective From</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-border">
              {rates.map((rate) => (
                <div
                  className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,1fr)] items-center gap-4 px-4 py-3 hover:bg-muted/50"
                  key={rate.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{rate.rateName}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {rate.note || "No notes"}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">{rate.displayType}</div>
                  <div className="text-sm font-medium">{rate.displayUnit}</div>
                  <div className="text-sm font-medium">{rate.rateToBdt}</div>
                  <div className="text-sm text-muted-foreground">{rate.country || "General"}</div>
                  <div className="text-sm text-muted-foreground">{formatDate(rate.effectiveDate)}</div>
                  <div><RateStatusBadge status={rate.displayStatus} /></div>
                  <div className="flex flex-wrap gap-2">
                    <Button className="h-8 px-3 text-xs" onClick={() => onCreateNewRate(rate)} variant="outline">
                      New Rate
                    </Button>
                    <Button className="h-8 px-3 text-xs" onClick={() => onEdit(rate)} variant="outline">
                      Edit
                    </Button>
                    <Button className="h-8 px-3 text-xs" onClick={() => onToggleStatus(rate)} variant="outline">
                      Disable
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:hidden">
        {rates.map((rate) => (
          <Card key={rate.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{rate.rateName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{rate.displayType}</p>
                </div>
                <RateStatusBadge status={rate.displayStatus} />
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Currency/Unit: {rate.displayUnit}</p>
                <p>Rate to BDT: {rate.rateToBdt}</p>
                <p>Country: {rate.country || "General"}</p>
                <p>Effective: {formatDate(rate.effectiveDate)}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="w-auto px-4" onClick={() => onCreateNewRate(rate)} variant="outline">
                  New Rate
                </Button>
                <Button className="w-auto px-4" onClick={() => onEdit(rate)} variant="outline">
                  Edit
                </Button>
                <Button className="w-auto px-4" onClick={() => onToggleStatus(rate)} variant="outline">
                  Disable
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
