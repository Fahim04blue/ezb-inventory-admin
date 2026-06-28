import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProductVariantThumbnail({
  imageUrl,
  alt,
  className,
}: {
  imageUrl?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-slate-400",
        className,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <ImageIcon className="h-4 w-4" aria-hidden="true" />
      )}
    </span>
  );
}
