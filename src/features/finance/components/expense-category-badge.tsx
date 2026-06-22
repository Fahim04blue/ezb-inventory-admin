import { ExpenseCategory } from "@/lib/domain-enums";
import { Badge } from "@/components/ui/badge";
import { formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ExpenseCategoryBadgeProps {
  category: ExpenseCategory;
  className?: string;
}

export function ExpenseCategoryBadge({ category, className }: ExpenseCategoryBadgeProps) {
  const getColorClasses = () => {
    switch (category) {
      case ExpenseCategory.PRODUCT_PURCHASE:
        return "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200";
      case ExpenseCategory.CARGO_WEIGHT_CHARGE:
        return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
      case ExpenseCategory.PACKAGING:
        return "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200";
      case ExpenseCategory.COURIER:
      case ExpenseCategory.TRANSPORT:
        return "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200";
      case ExpenseCategory.FACEBOOK_BOOST:
      case ExpenseCategory.INSTAGRAM_BOOST:
      case ExpenseCategory.META_ADS:
        return "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200";
      case ExpenseCategory.GIVEAWAY:
      case ExpenseCategory.PR_PROMOTION:
        return "bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200";
      case ExpenseCategory.DAMAGE_LOSS:
      case ExpenseCategory.REFUND:
        return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
      case ExpenseCategory.PAYMENT_CHARGE:
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200";
      case ExpenseCategory.TOOLS_SUBSCRIPTION:
        return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium whitespace-nowrap", getColorClasses(), className)}
    >
      {formatEnum(category)}
    </Badge>
  );
}
