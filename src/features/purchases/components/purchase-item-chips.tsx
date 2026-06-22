import { cn } from "@/lib/utils";
import { type PurchaseItemView } from "../types/purchase.types";

export function PurchaseItemChips({
  items,
  className,
}: {
  items: PurchaseItemView[];
  className?: string;
}) {
  const previewItems = items.slice(0, 3);
  const extraCount = items.length - previewItems.length;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {previewItems.map((item) => (
        <span
          key={item.id}
          className="inline-flex max-w-[164px] items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] leading-none text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
          title={`${item.productVariant.product.name} ×${item.quantity}`}
        >
          <span className="truncate font-medium">{item.productVariant.product.name}</span>
          <span className="shrink-0 font-semibold text-stone-950">×{item.quantity}</span>
        </span>
      ))}

      {extraCount > 0 && (
        <span className="inline-flex items-center rounded-md border border-stone-200 bg-stone-100 px-2 py-1 text-[11px] font-semibold leading-none text-stone-700">
          +{extraCount} more
        </span>
      )}
    </div>
  );
}
