import { SourceBadge } from "@/components/common/source-badge";
import { cn } from "@/lib/utils";

export function SheinSourceBadge({
  source,
  className,
}: {
  source?: string | null;
  className?: string;
}) {
  if (!source?.trim()) return null;

  return <SourceBadge className={cn("px-2 py-0.5 text-[11px]", className)} source={source} />;
}
