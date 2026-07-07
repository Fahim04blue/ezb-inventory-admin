import { cn } from "@/lib/utils";

export function SheinSourceBadge({
  source,
  className,
}: {
  source?: string | null;
  className?: string;
}) {
  const label = source?.trim();

  if (!label) return null;

  return (
    <span className={cn("inline-flex w-fit max-w-full items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700", className)}>
      <span className="truncate">{label}</span>
    </span>
  );
}
