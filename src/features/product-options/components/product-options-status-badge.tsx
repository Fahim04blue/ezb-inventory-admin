import { cn } from "@/lib/utils";

export function ProductOptionsStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
