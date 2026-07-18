import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const sourceStyles = {
  FACEBOOK: {
    logo: "/brand-logos/facebook-logo.svg",
    className: "border-[#1877F2]/20 bg-[#1877F2]/5 text-[#1877F2]",
  },
  INSTAGRAM: {
    logo: "/brand-logos/instagram-logo.svg",
    className: "border-[#C13584]/20 bg-[#C13584]/5 text-[#C13584]",
  },
  WHATSAPP: {
    logo: "/brand-logos/whatsapp-logo.svg",
    className: "border-[#25D366]/20 bg-[#25D366]/5 text-[#128C4A]",
  },
  SHEIN: {
    logo: "/brand-logos/shein-logo.svg",
    className: "border-black/15 bg-black/[0.03] text-black",
  },
} as const;

type BrandedSource = keyof typeof sourceStyles;

interface SourceBadgeProps {
  source?: string | null;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const normalizedSource = source?.trim().toUpperCase();

  if (!normalizedSource) {
    return <span className="text-muted-foreground">-</span>;
  }

  const style = sourceStyles[normalizedSource as BrandedSource];

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex w-fit max-w-full items-center gap-1.5 whitespace-nowrap font-medium",
        style?.className ?? "border-slate-200 bg-slate-50 text-slate-700",
        className,
      )}
    >
      {style ? (
        <Image
          alt=""
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 object-contain"
          height={14}
          src={style.logo}
          width={14}
        />
      ) : null}
      <span className="truncate">{formatEnum(normalizedSource)}</span>
    </Badge>
  );
}
