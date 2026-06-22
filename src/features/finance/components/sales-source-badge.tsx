import { OrderSource } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface SalesSourceBadgeProps {
  source: OrderSource | null;
  className?: string;
}

export function SalesSourceBadge({ source, className }: SalesSourceBadgeProps) {
  if (!source) {
    return <span className="text-muted-foreground">-</span>;
  }

  const getColorClasses = () => {
    switch (source) {
      case OrderSource.FACEBOOK:
        return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
      case OrderSource.INSTAGRAM:
        return "bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 border-fuchsia-200";
      case OrderSource.WHATSAPP:
        return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
      case OrderSource.OFFLINE:
        return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
      case OrderSource.MIXED:
        return "bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium whitespace-nowrap", getColorClasses(), className)}
    >
      {formatEnum(source)}
    </Badge>
  );
}
