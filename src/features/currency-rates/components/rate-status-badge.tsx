import type { RateLifecycleStatus } from "@/features/currency-rates/types/currency-rate";

const styles: Record<RateLifecycleStatus, string> = {
  CURRENT: "bg-green-100 text-green-700",
  HISTORY: "bg-amber-100 text-amber-700",
  DISABLED: "bg-zinc-200 text-zinc-600",
};

const labels: Record<RateLifecycleStatus, string> = {
  CURRENT: "Current",
  HISTORY: "History",
  DISABLED: "Disabled",
};

export function RateStatusBadge({
  status,
}: {
  status: RateLifecycleStatus;
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
