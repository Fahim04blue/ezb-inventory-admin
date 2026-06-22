import { ExpenseCategory } from "@/lib/domain-enums";

import { Badge } from "@/components/ui/badge";
import { formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ExpenseCategoryBadgeProps {
  category: ExpenseCategory;
  className?: string;
}

const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  PRODUCT_PURCHASE: "border-purple-200 bg-purple-50 text-purple-700",
  CARGO_WEIGHT_CHARGE: "border-sky-200 bg-sky-50 text-sky-700",
  PACKAGING: "border-amber-200 bg-amber-50 text-amber-700",
  COURIER: "border-orange-200 bg-orange-50 text-orange-700",
  FACEBOOK_BOOST: "border-indigo-200 bg-indigo-50 text-indigo-700",
  INSTAGRAM_BOOST: "border-indigo-200 bg-indigo-50 text-indigo-700",
  META_ADS: "border-blue-200 bg-blue-50 text-blue-700",
  GIVEAWAY: "border-pink-200 bg-pink-50 text-pink-700",
  PR_PROMOTION: "border-rose-200 bg-rose-50 text-rose-700",
  DAMAGE_LOSS: "border-red-200 bg-red-50 text-red-700",
  TRANSPORT: "border-orange-200 bg-orange-50 text-orange-700",
  PAYMENT_CHARGE: "border-yellow-200 bg-yellow-50 text-yellow-700",
  REFUND: "border-red-200 bg-red-50 text-red-700",
  TOOLS_SUBSCRIPTION: "border-slate-200 bg-slate-50 text-slate-700",
  OTHER: "border-gray-200 bg-slate-50 text-slate-700",
};

export function ExpenseCategoryBadge({
  category,
  className,
}: ExpenseCategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium shadow-none",
        CATEGORY_STYLES[category],
        className,
      )}
    >
      {formatEnum(category)}
    </Badge>
  );
}
