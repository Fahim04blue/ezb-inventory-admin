import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { SheinBatchView } from "../types/shein.types";
import { SheinStatusBadge } from "./shein-status-badge";

export function SheinBatchMobileCardList({
  batches,
  onOpen,
}: {
  batches: SheinBatchView[];
  onOpen: (batch: SheinBatchView) => void;
}) {
  return (
    <div className="grid gap-4 md:hidden">
      {batches.map((batch) => (
        <button
          key={batch.id}
          className="rounded-3xl border bg-card p-5 text-left shadow-sm"
          onClick={() => onOpen(batch)}
          type="button"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{batch.batchName}</p>
              <p className="text-sm text-muted-foreground">
                {batch.sourceCountry} / {batch.currency}
              </p>
            </div>
            <SheinStatusBadge status={batch.status} />
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <MobileRow label="SHEIN order" value={batch.sheinOrderNumbers || "-"} />
            <MobileRow label="Tracking" value={batch.sheinTrackingNumber || "-"} />
            <MobileRow label="Bank rate" value={batch.bankRate ? `1 RM = ${formatNumber(batch.bankRate)} BDT` : "Pending"} />
            <MobileRow label="Order total" value={`RM ${formatNumber(batch.totalRm)} / ${formatCurrency(batch.estimatedCustomerValue)}`} />
          </div>
        </button>
      ))}
    </div>
  );
}

function MobileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
