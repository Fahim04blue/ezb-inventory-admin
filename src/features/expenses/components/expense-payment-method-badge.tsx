import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExpensePaymentMethodBadgeProps {
  paymentMethod: string | null;
  className?: string;
}

export function ExpensePaymentMethodBadge({
  paymentMethod,
  className,
}: ExpensePaymentMethodBadgeProps) {
  if (!paymentMethod) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-none",
        className,
      )}
    >
      {paymentMethod}
    </Badge>
  );
}
