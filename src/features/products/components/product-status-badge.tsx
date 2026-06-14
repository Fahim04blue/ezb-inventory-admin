import { clsx } from "clsx";

export function ProductStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
