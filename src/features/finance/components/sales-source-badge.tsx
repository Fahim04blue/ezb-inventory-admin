import { OrderSource } from "@/lib/domain-enums";
import { SourceBadge } from "@/components/common/source-badge";

interface SalesSourceBadgeProps {
  source: OrderSource | null;
  className?: string;
}

export function SalesSourceBadge({ source, className }: SalesSourceBadgeProps) {
  return <SourceBadge className={className} source={source} />;
}
