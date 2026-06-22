import { formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const paymentStatusStyles: Record<string, string> = {
  UNPAID: "border-rose-200 bg-rose-100/90 text-rose-900",
  PARTIAL: "border-amber-200 bg-amber-100/90 text-amber-900",
  PAID: "border-emerald-200 bg-emerald-100/90 text-emerald-900",
  REFUNDED: "border-blue-200 bg-blue-50 text-blue-800",
};

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none whitespace-nowrap",
        paymentStatusStyles[status] ?? "border-stone-200 bg-stone-100 text-stone-800",
      )}
    >
      {formatEnum(status)}
    </span>
  );
}
