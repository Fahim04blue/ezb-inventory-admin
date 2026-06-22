import { formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const purchaseStatusStyles: Record<string, string> = {
  ORDERED: "border-amber-200 bg-amber-100/90 text-amber-900",
  IN_CARGO: "border-sky-200 bg-sky-100/90 text-sky-900",
  PARTIALLY_RECEIVED: "border-violet-200 bg-violet-100/90 text-violet-900",
  RECEIVED: "border-emerald-200 bg-emerald-100/90 text-emerald-900",
  CANCELLED: "border-rose-200 bg-rose-100/90 text-rose-900",
};

export function PurchaseStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none whitespace-nowrap",
        purchaseStatusStyles[status] ?? "border-stone-200 bg-stone-100 text-stone-800",
      )}
    >
      {formatEnum(status)}
    </span>
  );
}
